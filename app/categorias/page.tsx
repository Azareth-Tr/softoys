"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

// Definimos la estructura de una categoría
interface Categoria {
  id: string;
  nombre: string;
  descripcion: string | null;
  codigo: string;
}

export default function CategoriasPage() {
  // Definimos los tipos de nuestros estados
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function obtenerCategorias() {
      const { data, error } = await supabase
        .from("categorias")
        .select("id, nombre, descripcion, codigo")
        .order("nombre");

      if (error) {
        setError(error.message);
        return;
      }

      setCategorias(data ?? []);
    }

    obtenerCategorias();
  }, []);

  return (
    <main style={{ padding: "30px" }}>
      <h1>Categorías de Softoys</h1>

      {error && <p>Error: {error}</p>}

      {categorias.map((categoria) => (
        <div key={categoria.id}>
          <h3>{categoria.nombre}</h3>
          <p>{categoria.descripcion}</p>
        </div>
      ))}
    </main>
  );
}