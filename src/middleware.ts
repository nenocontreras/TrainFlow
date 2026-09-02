import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const AUTH_ROUTES = ["/login", "/register", "/confirmar-correo"];
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/planes",
  "/ejercicios",
  "/atletas",
  "/hoy",
  "/historial",
  "/plan",
];

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  // Sin sesión en ruta protegida -> a login (guardando el destino).
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Con sesión en login/register -> fuera (a la raíz, que resuelve el aterrizaje).
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Excluye assets estáticos, el manifest y el service worker de Serwist.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|swe-worker-.*\\.js|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
