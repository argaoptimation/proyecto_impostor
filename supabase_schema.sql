-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Delete existing tables if redefining
drop table if exists public.votes cascade;
drop table if exists public.game_state cascade;
drop table if exists public.players cascade;
drop table if exists public.rooms cascade;

-- Rooms Table
create table public.rooms (
    id uuid default uuid_generate_v4() primary key,
    code text not null unique,
    host_id uuid references auth.users not null,
    status text not null default 'LOBBY' check (status in ('LOBBY', 'ROLE_REVEAL', 'SPEAKING_TURNS', 'VOTING', 'RESULTS')),
    turn_duration int not null default 60,
    voting_duration int not null default 120,
    level text not null default 'A1',
    hints_enabled boolean not null default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Players Table
create table public.players (
    id uuid default uuid_generate_v4() primary key,
    room_id uuid references public.rooms on delete cascade not null,
    nickname text not null,
    role text check (role in ('IMPOSTOR', 'CITIZEN')),
    secret_word text,
    turn_order int,
    is_eliminated boolean default false,
    score int default 0,
    last_seen timestamp with time zone default timezone('utc'::text, now()),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(room_id, nickname)
);

-- Game State Table
CREATE TABLE public.game_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
    phase phase_type DEFAULT 'LOBBY',
    current_turn_player_id UUID REFERENCES public.players(id),
    current_turn_index INTEGER DEFAULT 0,
    secret_word TEXT,
    turn_started_at TIMESTAMP WITH TIME ZONE,
    is_paused BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Votes Table
create table public.votes (
    id uuid default uuid_generate_v4() primary key,
    room_id uuid references public.rooms on delete cascade not null,
    voter_id uuid references public.players on delete cascade not null,
    target_id uuid references public.players on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(room_id, voter_id)
);

-- Setup RLS (Row Level Security)
alter table public.rooms enable row level security;
alter table public.players enable row level security;
alter table public.game_state enable row level security;
alter table public.votes enable row level security;

-- Rooms Policies
create policy "Anyone can read rooms" on public.rooms for select using (true);
create policy "Hosts can create rooms" on public.rooms for insert with check (auth.uid() = host_id);
create policy "Hosts can update their rooms" on public.rooms for update using (auth.uid() = host_id);
create policy "Hosts can delete their rooms" on public.rooms for delete using (auth.uid() = host_id);

-- Players Policies
create policy "Anyone can read players" on public.players for select using (true);
create policy "Anyone can insert players (join room)" on public.players for insert with check (true);
create policy "Anyone can update players" on public.players for update using (true);
create policy "Hosts can delete players" on public.players for delete using (
    exists (select 1 from public.rooms where rooms.id = players.room_id and rooms.host_id = auth.uid())
);

-- Game State Policies
create policy "Anyone can read game state" on public.game_state for select using (true);
create policy "Anyone can insert game state" on public.game_state for insert with check (true);
create policy "Anyone can update game state" on public.game_state for update using (true);

-- Votes Policies
create policy "Anyone can read votes" on public.votes for select using (true);
create policy "Anyone can insert votes" on public.votes for insert with check (true);

-- Enable Realtime for all tables
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table game_state;
alter publication supabase_realtime add table votes;
