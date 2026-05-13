import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/server";

export async function getCurrentAppUser() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) {
    return null;
  }

  const existingByAuthId = await prisma.user.findFirst({
    where: { authUserId: authUser.id },
  });

  if (existingByAuthId) {
    if (existingByAuthId.isSeedUser) {
      return prisma.user.update({
        where: { id: existingByAuthId.id },
        data: { isSeedUser: false },
      });
    }
    return existingByAuthId;
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email: authUser.email },
  });

  if (existingByEmail) {
    return prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        authUserId: authUser.id,
        isSeedUser: false,
      },
    });
  }

  return prisma.user.create({
    data: {
      authUserId: authUser.id,
      isSeedUser: false,
      email: authUser.email,
      // Compatibility fallback for stale runtime clients during hot-reload.
      // Supabase remains the credential authority; this value is never used for auth.
      password: "__SUPABASE_AUTH_MANAGED__",
      name: authUser.user_metadata?.name ?? authUser.email.split("@")[0],
      role: "CUSTOMER",
    },
  });
}

export async function getVendorAccessOrRedirect(vendorSlug?: string) {
  const appUser = await getCurrentAppUser();

  if (!appUser) {
    redirect("/auth/login");
  }

  const memberships = await prisma.vendorUser.findMany({
    where: { userId: appUser.id },
    include: {
      vendor: {
        select: {
          id: true,
          name: true,
          slug: true,
          businessType: true,
          tagline: true,
          supportPhone: true,
          supportEmail: true,
          isActive: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  if (memberships.length === 0) {
    redirect("/account/become-vendor?error=no_vendor_access");
  }

  const activeMembership =
    (vendorSlug
      ? memberships.find((membership) => membership.vendor.slug === vendorSlug)
      : null) ?? memberships[0];

  if (!activeMembership.vendor.isActive) {
    redirect("/account/become-vendor?error=vendor_inactive");
  }

  return {
    user: appUser,
    memberships,
    activeMembership,
    activeVendor: activeMembership.vendor,
  };
}
