import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getRequiredAdmin } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { UserDetailsCard } from "../../_components/user-details-card";
import { UserActions } from "./_components/user-actions";
import { UserProviders } from "./_components/user-providers";
import { UserSessions } from "./_components/user-sessions";

export default async function Page(props: PageProps<"/admin/users/[userId]">) {
  return (
    <Suspense fallback={null}>
      <RoutePage {...props} />
    </Suspense>
  );
}

async function RoutePage(props: PageProps<"/admin/users/[userId]">) {
  const params = await props.params;
  await getRequiredAdmin();

  const userData = await prisma.user.findUnique({
    where: {
      id: params.userId,
    },
    include: {
      subscription: true,
      accounts: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!userData) {
    notFound();
  }

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>User Details</LayoutTitle>
        <LayoutDescription>View and manage user information</LayoutDescription>
      </LayoutHeader>
      <LayoutActions>
        <UserActions user={userData} />
      </LayoutActions>

      <LayoutContent className="flex flex-col gap-4">
        <UserDetailsCard user={userData} />

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            {!userData.subscription ? (
              <div className="text-muted-foreground py-4 text-center">
                No subscription found
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Avatar className="size-10">
                  <AvatarImage src={userData.image ?? undefined} />
                  <AvatarFallback className="text-sm">
                    {userData.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {userData.subscription.plan}
                    </span>
                    <Badge
                      variant={
                        userData.subscription.status === "active"
                          ? "default"
                          : userData.subscription.status === "canceled"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {userData.subscription.status}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <UserSessions userId={userData.id} />
        <UserProviders accounts={userData.accounts} />
      </LayoutContent>
    </Layout>
  );
}
