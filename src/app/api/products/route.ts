import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation şeması
const productSchema = z.object({
  name: z.string().min(1, "Ürün adı zorunludur"),
  currentPrice: z.number().min(0, "Fiyat negatif olamaz"),
  stock: z.number().min(0, "Stok negatif olamaz"),
  description: z.string().optional(),
  typeId: z.number().min(1, "Ürün tipi seçimi zorunludur"),
});

// GET - Ürün Listesi (Tüm ürünler - aktif/pasif dahil)
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        type: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Ürünler getirilirken hata:", error);
    return NextResponse.json(
      { success: false, error: "Ürünler getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni Ürün Ekleme
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validation
    const validatedData = productSchema.parse(body);

    // Aynı isimde ürün var mı kontrol et
    const existingProduct = await prisma.product.findFirst({
      where: {
        name: validatedData.name,
        isActive: true,
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: "Bu isimde bir ürün zaten mevcut" },
        { status: 400 }
      );
    }

    // ProductType var mı kontrol et
    const productType = await prisma.productType.findUnique({
      where: { id: validatedData.typeId },
    });

    if (!productType) {
      return NextResponse.json(
        { success: false, error: "Geçersiz ürün tipi" },
        { status: 400 }
      );
    }

    // Yeni ürün oluştur
    const newProduct = await prisma.product.create({
      data: {
        name: validatedData.name,
        currentPrice: validatedData.currentPrice,
        stock: validatedData.stock,
        description: validatedData.description,
        typeId: validatedData.typeId,
        isActive: true,
      },
      include: {
        type: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    // Transaction log ekle
    await prisma.transaction.create({
      data: {
        action: "CREATE",
        description: `Yeni ürün eklendi: ${newProduct.name}`,
        details: JSON.stringify({
          productId: newProduct.id,
          productName: newProduct.name,
          price: newProduct.currentPrice,
          stock: newProduct.stock,
        }),
        productId: newProduct.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Ürün başarıyla eklendi",
      data: newProduct,
    });
  } catch (error) {
    console.error("Ürün eklenirken hata:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Ürün eklenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Toplu Ürün Silme (Soft Delete)
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { productIds } = body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Silinecek ürün ID'leri gerekli" },
        { status: 400 }
      );
    }

    // ID'lerin geçerli olduğunu kontrol et
    const validIds = productIds
      .filter((id) => !isNaN(parseInt(id)))
      .map((id) => parseInt(id));

    if (validIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Geçerli ürün ID'si bulunamadı" },
        { status: 400 }
      );
    }

    // Silinecek ürünleri kontrol et
    const existingProducts = await prisma.product.findMany({
      where: {
        id: { in: validIds },
        isActive: true,
      },
    });

    if (existingProducts.length === 0) {
      return NextResponse.json(
        { success: false, error: "Silinecek aktif ürün bulunamadı" },
        { status: 404 }
      );
    }

    // Aktif siparişlerde kullanılan ürünleri kontrol et
    const productsInActiveOrders = await prisma.orderItem.findMany({
      where: {
        productId: { in: validIds },
        order: {
          statusId: {
            not: 3, // "İptal Edildi" status ID'si değil
          },
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
        order: {
          select: {
            id: true,
          },
        },
      },
    });

    if (productsInActiveOrders.length > 0) {
      const conflictProducts = [
        ...new Set(productsInActiveOrders.map((item) => item.product.name)),
      ];
      return NextResponse.json(
        {
          success: false,
          error: `Şu ürünler aktif siparişlerde kullanılıyor ve silinemez: ${conflictProducts.join(
            ", "
          )}`,
          data: {
            conflictProducts: productsInActiveOrders,
          },
        },
        { status: 400 }
      );
    }

    // Toplu soft delete yap
    const result = await prisma.product.updateMany({
      where: {
        id: { in: validIds },
        isActive: true,
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    // Transaction log ekle
    for (const product of existingProducts) {
      await prisma.transaction.create({
        data: {
          action: "DELETE",
          description: `Ürün toplu silme işlemi: ${product.name}`,
          details: JSON.stringify({
            productId: product.id,
            productName: product.name,
            batchOperation: true,
            deletedCount: result.count,
          }),
          productId: product.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `${result.count} ürün başarıyla silindi`,
      data: {
        deletedCount: result.count,
        requestedCount: validIds.length,
      },
    });
  } catch (error) {
    console.error("Ürünler silinirken hata:", error);
    return NextResponse.json(
      { success: false, error: "Ürünler silinemedi" },
      { status: 500 }
    );
  }
}
