import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation şeması
const productUpdateSchema = z
  .object({
    name: z.string().min(1, "Ürün adı zorunludur").optional(),
    currentPrice: z.number().min(0, "Fiyat negatif olamaz").optional(),
    stock: z.number().min(0, "Stok negatif olamaz").optional(),
    minStockLevel: z.number().min(0, "Minimum stok negatif olamaz").optional(),
    description: z.string().optional(),
    typeId: z.number().min(1, "Ürün tipi seçimi zorunludur").optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "En az bir alan güncellenmelidir",
  });

// GET - Tek Ürün Getir
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: "Geçersiz ürün ID" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
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

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Ürün bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Ürün getirilirken hata:", error);
    return NextResponse.json(
      { success: false, error: "Ürün getirilemedi" },
      { status: 500 }
    );
  }
}

// PUT - Ürün Güncelle
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: "Geçersiz ürün ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = productUpdateSchema.parse(body);

    // Ürün var mı kontrol et
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: "Ürün bulunamadı" },
        { status: 404 }
      );
    }

    // Aynı isimde başka ürün var mı kontrol et (kendisi hariç) - sadece name güncellenmişse
    if (validatedData.name) {
      const duplicateProduct = await prisma.product.findFirst({
        where: {
          name: validatedData.name,
          id: { not: productId },
          isActive: true,
        },
      });

      if (duplicateProduct) {
        return NextResponse.json(
          { success: false, error: "Bu isimde başka bir ürün zaten mevcut" },
          { status: 400 }
        );
      }
    }

    // ProductType var mı kontrol et - sadece typeId güncellenmişse
    if (validatedData.typeId) {
      const productType = await prisma.productType.findUnique({
        where: { id: validatedData.typeId },
      });

      if (!productType) {
        return NextResponse.json(
          { success: false, error: "Geçersiz ürün tipi" },
          { status: 400 }
        );
      }
    }

    // Güncellenecek alanları hazırla
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.currentPrice !== undefined)
      updateData.currentPrice = validatedData.currentPrice;
    if (validatedData.stock !== undefined)
      updateData.stock = validatedData.stock;
    if (validatedData.minStockLevel !== undefined)
      updateData.minStockLevel = validatedData.minStockLevel;
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description;
    if (validatedData.typeId !== undefined)
      updateData.typeId = validatedData.typeId;
    if (validatedData.isActive !== undefined)
      updateData.isActive = validatedData.isActive;

    // Ürünü güncelle
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
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
        action: "UPDATE",
        description: `Ürün güncellendi: ${updatedProduct.name}`,
        details: JSON.stringify({
          productId: updatedProduct.id,
          productName: updatedProduct.name,
          oldPrice: existingProduct.currentPrice,
          newPrice: updatedProduct.currentPrice,
          oldStock: existingProduct.stock,
          newStock: updatedProduct.stock,
        }),
        productId: updatedProduct.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Ürün başarıyla güncellendi",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Ürün güncellenirken hata:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Ürün güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Ürün Sil (Soft Delete)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: "Geçersiz ürün ID" },
        { status: 400 }
      );
    }

    // Ürün var mı kontrol et
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: "Ürün bulunamadı" },
        { status: 404 }
      );
    }

    if (!existingProduct.isActive) {
      return NextResponse.json(
        { success: false, error: "Ürün zaten silinmiş" },
        { status: 400 }
      );
    }

    // Ürünün aktif siparişlerde kullanılıp kullanılmadığını kontrol et
    const activeOrders = await prisma.orderItem.findMany({
      where: {
        productId: productId,
        order: {
          statusId: {
            not: 3, // "İptal Edildi" status ID'si değil
          },
        },
      },
      include: {
        order: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    });

    if (activeOrders.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Bu ürün ${activeOrders.length} aktif siparişte kullanılıyor. Önce siparişleri tamamlamalı veya iptal etmelisiniz.`,
          data: {
            activeOrdersCount: activeOrders.length,
            orderIds: activeOrders.map((item) => item.order.id),
          },
        },
        { status: 400 }
      );
    }

    // Soft delete yap
    const deletedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    // Transaction log ekle
    await prisma.transaction.create({
      data: {
        action: "DELETE",
        description: `Ürün silindi: ${deletedProduct.name}`,
        details: JSON.stringify({
          productId: deletedProduct.id,
          productName: deletedProduct.name,
          finalPrice: deletedProduct.currentPrice,
          finalStock: deletedProduct.stock,
        }),
        productId: deletedProduct.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Ürün başarıyla silindi",
    });
  } catch (error) {
    console.error("Ürün silinirken hata:", error);
    return NextResponse.json(
      { success: false, error: "Ürün silinemedi" },
      { status: 500 }
    );
  }
}
