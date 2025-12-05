// API pública para obtener artículos por slug
import { query } from '@/config/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({ error: 'Slug requerido' });
  }

  try {
    
    // Obtener el artículo directamente de la tabla
    const result = await query(
      'SELECT * FROM articles WHERE slug = $1 AND status = $2',
      [slug, 'published']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }

    const articleData = result.rows[0];

    // Obtener las secciones del artículo
    const sectionsResult = await query(`
      SELECT 
        section_key,
        title,
        description,
        content,
        order_index
      FROM article_sections 
      WHERE article_id = $1 
      ORDER BY order_index ASC
    `, [articleData.id]);

    // Estructurar la respuesta
    const article = {
      id: articleData.id,
      slug: articleData.slug,
      title: articleData.title,
      content: articleData.content,
      meta_description: articleData.meta_description,
      meta_keywords: articleData.meta_keywords,
      status: articleData.status,
      created_at: articleData.created_at,
      updated_at: articleData.updated_at,
      sections: sectionsResult.rows || []
    };
    res.status(200).json(article);

  } catch (error) {
    console.error('Error obteniendo artículo:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}