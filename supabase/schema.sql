-- Coaches table
create table if not exists coaches (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on coaches
alter table coaches enable row level security;

-- Coaches can read their own profile
create policy "Coaches can read own profile"
  on coaches for select
  using (auth.uid() = id);

-- Admins can read all coaches
create policy "Admins can read all coaches"
  on coaches for select
  to authenticated
  using (
    exists (
      select 1 from coaches c 
      where c.id = auth.uid() and c.is_admin = true
    )
  );

-- Coaches can update their own profile
create policy "Coaches can update own profile"
  on coaches for update
  using (auth.uid() = id);

-- Allow inserts during signup (authenticated users can create their own coach record)
create policy "Allow coach signup"
  on coaches for insert
  to authenticated
  with check (auth.uid() = id);

-- Allow service role to insert (for triggers)
create policy "Allow service role inserts"
  on coaches for insert
  to service_role
  with check (true);

-- Athletes table (master list - accessible to all coaches)
create table if not exists athletes (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  email text,
  date_of_birth date,
  group_name text,  -- e.g., "SATURDAYS - CYPRESS MOUNTAIN 2026"
  day text,        -- e.g., "SATURDAYS"
  mountain text,   -- e.g., "CYPRESS MOUNTAIN"
  coach_name text, -- e.g., "DEXTER D" - the coach assigned to this athlete
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Coach roster selections (which athletes each coach has added to their personal roster)
create table if not exists coach_roster (
  id uuid default gen_random_uuid() primary key,
  coach_id uuid references coaches(id) on delete cascade not null,
  athlete_id uuid references athletes(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(coach_id, athlete_id)
);

-- Report cards for admin review and parent delivery
create table if not exists report_cards (
  id uuid default gen_random_uuid() primary key,
  evaluation_id uuid references evaluations(id) on delete cascade not null,
  athlete_id uuid references athletes(id) on delete cascade not null,
  coach_id uuid references coaches(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected', 'sent')),
  admin_notes text,
  sent_to_parents boolean default false,
  sent_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on athletes
alter table athletes enable row level security;

-- All authenticated coaches can view all athletes (master list)
create policy "Coaches can view all athletes"
  on athletes for select
  to authenticated
  using (true);

-- All authenticated coaches can add/edit athletes
create policy "Coaches can manage athletes"
  on athletes for insert
  to authenticated
  with check (true);

create policy "Coaches can update athletes"
  on athletes for update
  to authenticated
  using (true);

create policy "Coaches can delete athletes"
  on athletes for delete
  to authenticated
  using (true);

-- Enable RLS on coach_roster
alter table coach_roster enable row level security;

-- Coaches can view their own roster selections
create policy "Coaches can view their roster"
  on coach_roster for select
  to authenticated
  using (auth.uid() = coach_id);

-- Coaches can add athletes to their roster
create policy "Coaches can add to roster"
  on coach_roster for insert
  to authenticated
  with check (auth.uid() = coach_id);

-- Coaches can remove athletes from their roster
create policy "Coaches can remove from roster"
  on coach_roster for delete
  to authenticated
  using (auth.uid() = coach_id);

-- Enable RLS on report_cards
alter table report_cards enable row level security;

-- Coaches can view their own report cards
create policy "Coaches can view their report cards"
  on report_cards for select
  to authenticated
  using (auth.uid() = coach_id);

-- Coaches can create report cards
create policy "Coaches can create report cards"
  on report_cards for insert
  to authenticated
  with check (auth.uid() = coach_id);

-- Admins can view all report cards
create policy "Admins can view all report cards"
  on report_cards for select
  to authenticated
  using (
    exists (
      select 1 from coaches c 
      where c.id = auth.uid() and c.is_admin = true
    )
  );

-- Admins can update report cards (approve/reject)
create policy "Admins can update report cards"
  on report_cards for update
  to authenticated
  using (
    exists (
      select 1 from coaches c 
      where c.id = auth.uid() and c.is_admin = true
    )
  );

-- Evaluation Templates table
create table if not exists evaluation_templates (
  id uuid default gen_random_uuid() primary key,
  coach_id uuid references coaches(id) on delete cascade not null,
  name text not null,
  description text,
  skills jsonb not null default '[]',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on evaluation_templates
alter table evaluation_templates enable row level security;

-- Coaches can CRUD their own templates
create policy "Coaches can manage their templates"
  on evaluation_templates for all
  using (auth.uid() = coach_id);

-- Evaluations table
create table if not exists evaluations (
  id uuid default gen_random_uuid() primary key,
  athlete_id uuid references athletes(id) on delete cascade not null,
  coach_id uuid references coaches(id) on delete cascade not null,
  template_id uuid references evaluation_templates(id) on delete cascade,
  skill_scores jsonb not null default '[]',
  notes text,
  evaluated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on evaluations
alter table evaluations enable row level security;

-- Coaches can CRUD their own evaluations
create policy "Coaches can manage their evaluations"
  on evaluations for all
  using (auth.uid() = coach_id);

-- Admins can read all evaluations (for review)
create policy "Admins can read all evaluations"
  on evaluations for select
  to authenticated
  using (
    exists (
      select 1 from coaches c 
      where c.id = auth.uid() and c.is_admin = true
    )
  );

-- Admins can update any evaluation (for review/editing)
create policy "Admins can update all evaluations"
  on evaluations for update
  to authenticated
  using (
    exists (
      select 1 from coaches c 
      where c.id = auth.uid() and c.is_admin = true
    )
  );

-- Athlete photos table (similar to athlete_videos)
create table if not exists athlete_photos (
  id uuid default gen_random_uuid() primary key,
  athlete_id uuid references athletes(id) on delete cascade not null,
  coach_id uuid references coaches(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  description text,
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on athlete_photos
alter table athlete_photos enable row level security;

-- Coaches can manage their own photos
create policy "Coaches can manage their photos"
  on athlete_photos for all
  using (auth.uid() = coach_id);

-- Admins can read all photos
create policy "Admins can read all photos"
  on athlete_photos for select
  to authenticated
  using (
    exists (
      select 1 from coaches c 
      where c.id = auth.uid() and c.is_admin = true
    )
  );

-- Trigger to automatically create coach profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.coaches (id, email, full_name, created_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
