
CREATE TABLE t_p41037438_bana_net_project.tickets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p41037438_bana_net_project.users(id),
  subject TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p41037438_bana_net_project.ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES t_p41037438_bana_net_project.tickets(id),
  author_id INTEGER NOT NULL REFERENCES t_p41037438_bana_net_project.users(id),
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX tickets_user_id_idx ON t_p41037438_bana_net_project.tickets(user_id);
CREATE INDEX tickets_status_idx ON t_p41037438_bana_net_project.tickets(status);
CREATE INDEX ticket_messages_ticket_id_idx ON t_p41037438_bana_net_project.ticket_messages(ticket_id);
