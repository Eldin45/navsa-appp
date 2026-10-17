import { prisma } from "~/lib/db";

export async function getProductById(id: number) {
  try {
    return await prisma.product.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}
