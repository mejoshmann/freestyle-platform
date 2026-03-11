-- Coaches table
create table if not exists coaches (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on coaches
alter table coaches enable row level security;

-- Coaches can read their own profile
create policy "Coaches can read own profile"
  on coaches for select
  using (auth.uid() = id);

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

-- Athletes table
create table if not exists athletes (
  id uuid default gen_random_uuid() primary key,
  coach_id uuid references coaches(id) on delete cascade not null,
  full_name text not null,
  email text,
  date_of_birth date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on athletes
alter table athletes enable row level security;

-- Coaches can CRUD their own athletes
create policy "Coaches can manage their athletes"
  on athletes for all
  using (auth.uid() = coach_id);

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
  template_id uuid references evaluation_templates(id) on delete cascade not null,
  skill_scores jsonb not null default '[]',
  notes text,
  evaluated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on evaluations
alter table evaluations enable row level security;

-- Coaches can CRUD their own evaluations
create policy "Coaches can manage their evaluations"
  on evaluations for all
  using (auth.uid() = coach_id);

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
