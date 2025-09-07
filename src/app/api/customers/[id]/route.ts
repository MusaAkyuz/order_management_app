import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Müşteri güncelleme için validation schema
const updateCustomerSchema = z.object({
  name: z.string().min(1, "Müşteri adı zorunludur").optional(),
  email: z
    .string()
    .email("Geçerli bir email adresi giriniz")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
  isCompany: z.boolean().optional(),
});

// GET - Tek Müşteri Getirme
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Geçersiz müşteri ID" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: {
        id: id,
        isActive: true,
      },
      include: {
        orders: {
          where: {
            isActive: true,
          },
          include: {
            status: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        transactions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Müşteri bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Müşteri getirilirken hata:", error);
    return NextResponse.json(
      { success: false, error: "Müşteri getirilemedi" },
      { status: 500 }
    );
  }
}

// PUT - Müşteri Güncelleme
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Geçersiz müşteri ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateCustomerSchema.parse(body);

    // Müşteri var mı kontrolü
    const existingCustomer = await prisma.customer.findUnique({
      where: {
        id: id,
        isActive: true,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, error: "Müşteri bulunamadı" },
        { status: 404 }
      );
    }

    // Email kontrolü (güncelleme yapılıyorsa ve başka müşteri kullanmıyorsa)
    if (validatedData.email && validatedData.email.trim() !== "") {
      const emailConflict = await prisma.customer.findUnique({
        where: {
          email: validatedData.email,
          NOT: { id: id },
        },
      });

      if (emailConflict) {
        return NextResponse.json(
          {
            success: false,
            error: "Bu email adresi başka bir müşteri tarafından kullanılıyor",
          },
          { status: 400 }
        );
      }
    }

    // Güncelleme verilerini hazırla
    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.email !== undefined) {
      updateData.email =
        validatedData.email && validatedData.email.trim() !== ""
          ? validatedData.email
          : null;
    }
    if (validatedData.phone !== undefined)
      updateData.phone = validatedData.phone || null;
    if (validatedData.address !== undefined)
      updateData.address = validatedData.address || null;
    if (validatedData.taxNumber !== undefined)
      updateData.taxNumber = validatedData.taxNumber || null;
    if (validatedData.isCompany !== undefined)
      updateData.isCompany = validatedData.isCompany;

    const updatedCustomer = await prisma.customer.update({
      where: { id: id },
      data: updateData,
    });

    // Transaction kaydı oluştur
    await prisma.transaction.create({
      data: {
        action: "CUSTOMER_UPDATED",
        description: `Müşteri bilgileri güncellendi: ${updatedCustomer.name}`,
        details: JSON.stringify({
          customerId: updatedCustomer.id,
          updatedFields: Object.keys(updateData),
        }),
        customerId: updatedCustomer.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedCustomer,
      message: "Müşteri başarıyla güncellendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Geçersiz veri", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Müşteri güncellenirken hata:", error);
    return NextResponse.json(
      { success: false, error: "Müşteri güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Müşteri Silme (Soft Delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Geçersiz müşteri ID" },
        { status: 400 }
      );
    }

    // Müşteri var mı kontrolü
    const existingCustomer = await prisma.customer.findUnique({
      where: {
        id: id,
        isActive: true,
      },
      include: {
        orders: {
          where: {
            isActive: true,
          },
        },
      },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, error: "Müşteri bulunamadı" },
        { status: 404 }
      );
    }

    // Aktif siparişi var mı kontrolü
    if (existingCustomer.orders.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Bu müşteriye ait aktif siparişler bulunduğu için silinemez",
        },
        { status: 400 }
      );
    }

    // Soft delete
    const deletedCustomer = await prisma.customer.update({
      where: { id: id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    // Transaction kaydı oluştur
    await prisma.transaction.create({
      data: {
        action: "CUSTOMER_DELETED",
        description: `Müşteri silindi: ${deletedCustomer.name}`,
        details: JSON.stringify({
          customerId: deletedCustomer.id,
          customerName: deletedCustomer.name,
        }),
        customerId: deletedCustomer.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Müşteri başarıyla silindi",
    });
  } catch (error) {
    console.error("Müşteri silinirken hata:", error);
    return NextResponse.json(
      { success: false, error: "Müşteri silinemedi" },
      { status: 500 }
    );
  }
}
