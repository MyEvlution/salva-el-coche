/**
 * Vite resuelve las imagenes importadas a una URL con hash. Se declara aqui
 * a mano y no con los tipos de Vite porque `tsconfig` no carga `@types`.
 *
 * Los dibujos con transparencia van en dos piezas —el color en JPEG y el
 * recorte en PNG— porque juntos pesan la sexta parte que un PNG con alfa.
 * `arte/interior.ts` los vuelve a unir al cargar.
 */
declare module '*.webp' {
  const url: string;
  export default url;
}

declare module '*.jpg' {
  const url: string;
  export default url;
}

declare module '*.png' {
  const url: string;
  export default url;
}
