/**
 * Vite resuelve las imagenes importadas a una URL con hash. Se declara aqui
 * a mano y no con los tipos de Vite porque `tsconfig` no carga `@types`.
 */
declare module '*.webp' {
  const url: string;
  export default url;
}
