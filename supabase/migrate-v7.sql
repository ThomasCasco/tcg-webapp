-- =====================================================================
-- Migration v7: chat por transacción (comprador <-> vendedor)
-- =====================================================================
-- Idempotente. Ejecutar DESPUES de migrate-v6.sql.
-- El acceso se controla en la API (solo partes del payment_events).
-- =====================================================================

create table if not exists public.transaction_chat_messages (
  id uuid primary key default gen_random_uuid(),
  transaction_id text not null references public.payment_events(transaction_id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_handle text not null,
  body text not null check (char_length(body) >= 1 and char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists idx_transaction_chat_tx_created
  on public.transaction_chat_messages (transaction_id, created_at asc);

comment on table public.transaction_chat_messages is 'Mensajes P2P post-reserva, por transaction_id.';
