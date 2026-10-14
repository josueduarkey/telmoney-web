/// <reference types="@clerk/astro/env" />

declare namespace App {
  interface Locals {
    /** Quien entró al panel (lo pone src/middleware.ts después de comprobar su correo). */
    admin?: { email: string; sessionId: string };
    /** Por qué el panel muestra un aviso en vez del contenido. */
    adminNotice?: 'forbidden' | 'not-configured';
  }
}
