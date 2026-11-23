/**
 * Database Seeder for Supabase Backend (Idempotent)
 * Usage (from client/):
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx ../supabase/seed/seedSupabase.ts
 */
import { createClient } from '@supabase/supabase-js';
import { DEMO_COURSES, DEMO_PROFILES } from '../../client/src/shared/data/demoSeed';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const defaultPassword = process.env.SEED_USER_PASSWORD ?? 'LokaTalentaDemo123!';

if (!supabaseUrl || !serviceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function ensureAuthUserMap(): Promise<Map<string, string>> {
  const emailToUid = new Map<string, string>();
  const { data: listed, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) {
    throw new Error(`Failed listing auth users: ${listErr.message}`);
  }

  for (const user of listed?.users ?? []) {
    if (user.email) {
      emailToUid.set(user.email.toLowerCase(), user.id);
    }
  }

  const demoIdToUid = new Map<string, string>();

  for (const p of DEMO_PROFILES) {
    const emailKey = p.email.toLowerCase();
    let uid = emailToUid.get(emailKey);

    if (!uid) {
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: p.email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: { full_name: p.full_name },
      });
      if (createErr || !created.user) {
        throw new Error(`Failed creating auth user ${p.email}: ${createErr?.message}`);
      }
      uid = created.user.id;
      emailToUid.set(emailKey, uid);
    }

    const { error: profErr } = await supabase.from('profiles').upsert(
      {
        id: uid,
        full_name: p.full_name,
        email: p.email,
        role: p.role,
        bio: p.bio ?? '',
        is_active: p.is_active ?? true,
      },
      { onConflict: 'id' }
    );
    if (profErr) {
      throw new Error(`Failed upserting profile ${p.email}: ${profErr.message}`);
    }

    demoIdToUid.set(p.id, uid);
  }

  return demoIdToUid;
}

async function seed() {
  console.log(`Seeding ${DEMO_PROFILES.length} profiles and ${DEMO_COURSES.length} courses into ${supabaseUrl}...`);

  const demoIdToUid = await ensureAuthUserMap();
  const fallbackTeacherId = demoIdToUid.get('demo-teacher-1') ?? Array.from(demoIdToUid.values())[0];

  if (!fallbackTeacherId) {
    throw new Error('No teacher profile available after seeding profiles.');
  }

  let coursesInserted = 0;
  let coursesSkipped = 0;

  for (const course of DEMO_COURSES) {
    const teacherUuid = demoIdToUid.get(course.teacher_id) ?? fallbackTeacherId;

    const { data: existingCourse } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', course.slug)
      .maybeSingle();

    let courseId = existingCourse?.id;

    if (!courseId) {
      const { data: cRow, error: cErr } = await supabase
        .from('courses')
        .insert({
          slug: course.slug,
          teacher_id: teacherUuid,
          title: course.title,
          description: course.description,
          category: course.category,
          level: course.level,
          estimated_hours: course.estimated_hours,
          thumbnail_url: course.thumbnail_url ?? null,
          is_published: course.is_published,
        })
        .select('id')
        .single();

      if (cErr || !cRow) {
        console.error(`Failed course ${course.slug}:`, cErr?.message);
        continue;
      }
      courseId = cRow.id;
    } else {
      const { count } = await supabase
        .from('modules')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', courseId);

      if ((count ?? 0) > 0) {
        coursesSkipped += 1;
        continue;
      }
    }

    coursesInserted += 1;

    for (const mod of course.modules ?? []) {
      const { data: mRow, error: mErr } = await supabase
        .from('modules')
        .insert({
          course_id: courseId,
          title: mod.title,
          order_index: mod.order_index,
        })
        .select('id')
        .single();

      if (mErr || !mRow) {
        console.error(`Failed module ${mod.title}:`, mErr?.message);
        continue;
      }

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

        const { error: qErr } = await supabase.from('questions').insert(questionRows);
        if (qErr) {
          console.error(`Failed questions for quiz ${les.quiz.title}:`, qErr.message);
        }
      }
    }
  }

  console.log(`Supabase seed completed. Seeded: ${coursesInserted}, Skipped (already seeded): ${coursesSkipped}.`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
