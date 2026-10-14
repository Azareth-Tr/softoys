import { supabase } from "@/lib/supabase";

export async function subirFotoProducto(archivo: File): Promise<string> {
 const extensiones: Record<string,string> = {"image/jpeg":"jpg","image/png":"png","image/webp":"webp"};
 const extension=extensiones[archivo.type];
 if(!extension || archivo.size === 0 || archivo.size > 5 * 1024 * 1024) throw new Error("Selecciona una foto JPG, PNG o WebP de hasta 5 MB.");
 const ruta=crypto.randomUUID()+"."+extension;
 const bucket=supabase.storage.from("fotos-productos");
 const {error}=await bucket.upload(ruta,archivo,{contentType:archivo.type,upsert:false});
 if(error) throw new Error("No se pudo subir la foto. Verifica el bucket fotos-productos y sus permisos en Supabase. " + error.message);
 return bucket.getPublicUrl(ruta).data.publicUrl;
}
