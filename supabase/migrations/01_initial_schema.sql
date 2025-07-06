-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.config (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  password_hash text,
  CONSTRAINT config_pkey PRIMARY KEY (id)
);
CREATE TABLE public.guesses (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  guesser_name text,
  boy_name_guess text,
  girl_name_guess text,
  CONSTRAINT guesses_pkey PRIMARY KEY (id)
);