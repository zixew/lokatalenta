/**
 * Database Seeder for Supabase Backend
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx ../supabase/seed/seedSupabase.ts
 */
import { createClient } from '@supabase/supabase-js';
import { DEMO_COURSES, DEMO_PROFILES } from '../../client/src/shared/data/demoSeed';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

async function seed() {
  console.log(`Seeding ${DEMO_PROFILES.length} profiles and ${DEMO_COURSES.length} courses...`);

  for (const p of DEMO_PROFILES) {
    await supabase.from('profiles').upsert(
      {
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        role: p.role,
        bio: p.bio ?? '',
        is_active: p.is_active ?? true,
      },
      { onConflict: 'email' }
    );
  }

  for (const course of DEMO_COURSES) {
    const { data: cRow, error: cErr } = await supabase
      .from('courses')
      .upsert(
        {
          slug: course.slug,
          teacher_id: course.teacher_id,
          title: course.title,
          description: course.description,
          category: course.category,
          level: course.level,
          estimated_hours: course.estimated_hours,
          thumbnail_url: course.thumbnail_url ?? null,
          is_published: course.is_published,
        },
        { onConflict: 'slug' }
      )
      .select('id')
      .single();

    if (cErr || !cRow) {
      console.error(`Failed course ${course.slug}:`, cErr?.message);
      continue;
    }

    for (const mod of course.modules ?? []) {
      const { data: mRow, error: mErr } = await supabase
        .from('modules')
        .insert({
          course_id: cRow.id,
          title: mod.title,
          order_index: mod.order_index,
        })
        .select('id')
        .single();

      if (mErr || !mRow) continue;

      for (const les of mod.lessons ?? []) {
        const { data: lRow, error: lErr } = await supabase
          .from('lessons')
          .insert({
            module_id: mRow.id,
            title: les.title,
            type: les.type,
            content: les.content,
            video_url: les.video_url ?? null,
            voice_lines: les.voice_lines ?? null,
            duration_minutes: les.duration_minutes,
            order_index: les.order_index,
          })
          .select('id')
          .single();

        if (lErr || !lRow || !les.quiz) continue;

        const { data: qzRow, error: qzErr } = await supabase
          .from('quizzes')
          .insert({
            lesson_id: lRow.id,
            title: les.quiz.title,
            description: les.quiz.description,
            duration_minutes: les.quiz.duration_minutes,
            passing_score: les.quiz.passing_score,
            use_subtests: les.quiz.use_subtests ?? true,
            question_limit: les.quiz.question_limit ?? null,
          })
          .select('id')
          .single();

        if (qzErr || !qzRow || !les.quiz.questions?.length) continue;

        const questionRows = les.quiz.questions.map((q) => ({
          quiz_id: qzRow.id,
          category_tag: q.category_tag,
          question_text: q.question_text,
          image_url: q.image_url ?? null,
          audio_text: q.audio_text ?? null,
          audio_lang: q.audio_lang ?? null,
          options: q.options,
          correct_option: q.correct_option,
          explanation: q.explanation,
          order_index: q.order_index,
        }));

        await supabase.from('questions').insert(questionRows);
      }
    }
  }

  console.log('Supabase seed completed.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
