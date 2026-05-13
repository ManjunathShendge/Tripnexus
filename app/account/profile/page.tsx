import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentAppUser } from "@/lib/vendor-context";

async function updateProfile(formData: FormData) {
  "use server";

  const user = await getCurrentAppUser();
  if (!user) {
    redirect("/auth/login?next=/account/profile");
  }

  const name = formData.get("name")?.toString().trim() ?? "";
  const phone = formData.get("phone")?.toString().trim() ?? "";
  const image = formData.get("image")?.toString().trim() ?? "";

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: name || null,
      phone: phone || null,
      image: image || null,
    },
  });

  revalidatePath("/account/profile");
  redirect("/account/profile?saved=1");
}

type ProfilePageProps = {
  searchParams: Promise<{ saved?: string }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const query = await searchParams;
  const user = await getCurrentAppUser();

  if (!user) {
    redirect("/auth/login?next=/account/profile");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-white">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage your customer profile information.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-orange-700 transition hover:border-orange-300 hover:bg-orange-50"
          >
            Back Home
          </Link>
        </div>

        {query.saved ? (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Profile updated successfully.
          </div>
        ) : null}

        <form action={updateProfile} className="space-y-4 rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              value={user.email}
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              name="name"
              defaultValue={user.name ?? ""}
              placeholder="Your full name"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-orange-200 focus:ring-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Phone
            </label>
            <input
              name="phone"
              defaultValue={user.phone ?? ""}
              placeholder="Phone number"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-orange-200 focus:ring-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Avatar URL
            </label>
            <input
              name="image"
              defaultValue={user.image ?? ""}
              placeholder="https://..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-orange-200 focus:ring-2"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
          >
            Save Profile
          </button>
        </form>
      </div>
    </main>
  );
}
