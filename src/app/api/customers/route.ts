import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CustomerFormData } from "@/types/api";

// Müşteri oluşturma/güncelleme için validation schema
const customerSchema = z.object({
  name: z.string().min(1, "Müşteri adı zorunludur"),
  email: z
    .string()
    .email("Geçerli bir email adresi giriniz")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
  isCompany: z.boolean().default(false),
});

// GET - Müşteri Listesi
export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        taxNumber: true,
        isCompany: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error("Müşteriler getirilirken hata:", error);
    return NextResponse.json(
      { success: false, error: "Müşteriler getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni Müşteri Oluşturma
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = customerSchema.parse(body);

    // Email kontrolü
    if (validatedData.email && validatedData.email.trim() !== "") {
      const existingCustomer = await prisma.customer.findUnique({
        where: { email: validatedData.email },
      });

      if (existingCustomer) {
        return NextResponse.json(
          { success: false, error: "Bu email adresi zaten kullanılıyor" },
          { status: 400 }
        );
      }
    }

    const customer = await prisma.customer.create({
      data: {
        name: validatedData.name,
        email:
          validatedData.email && validatedData.email.trim() !== ""
            ? validatedData.email
            : null,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        taxNumber: validatedData.taxNumber || null,
        isCompany: validatedData.isCompany,
        isActive: true,
      },
    });

    // Transaction kaydı oluştur
    await prisma.transaction.create({
      data: {
        action: "CUSTOMER_CREATED",
        description: `Yeni müşteri oluşturuldu: ${customer.name}`,
        details: JSON.stringify({
          customerId: customer.id,
          customerType: customer.isCompany ? "Firma" : "Bireysel",
        }),
        customerId: customer.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: customer,
      message: "Müşteri başarıyla oluşturuldu",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Geçersiz veri", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Müşteri oluşturulurken hata:", error);
    return NextResponse.json(
      { success: false, error: "Müşteri oluşturulamadı" },
      { status: 500 }
    );
  }
}
