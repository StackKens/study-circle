--
-- PostgreSQL database dump
--

\restrict IQyk96LcdhMHuxE3CGdveS86vTSrgLRxhrzAbbfBtkIxYI2jThiNxMxiLaIuo7X

-- Dumped from database version 18.3 (Ubuntu 18.3-1)
-- Dumped by pg_dump version 18.3 (Ubuntu 18.3-1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: stackkens
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO stackkens;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: friendships; Type: TABLE; Schema: public; Owner: stackkens
--

CREATE TABLE public.friendships (
    user_id uuid NOT NULL,
    friend_id uuid NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT friendships_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'declined'::character varying])::text[])))
);


ALTER TABLE public.friendships OWNER TO stackkens;

--
-- Name: group_members; Type: TABLE; Schema: public; Owner: stackkens
--

CREATE TABLE public.group_members (
    user_id uuid NOT NULL,
    group_id uuid NOT NULL,
    role character varying(20) DEFAULT 'member'::character varying NOT NULL,
    joined_at timestamp with time zone DEFAULT now(),
    CONSTRAINT group_members_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'member'::character varying])::text[])))
);


ALTER TABLE public.group_members OWNER TO stackkens;

--
-- Name: groups; Type: TABLE; Schema: public; Owner: stackkens
--

CREATE TABLE public.groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    subject character varying(255) NOT NULL,
    university character varying(255) NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.groups OWNER TO stackkens;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: stackkens
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    link character varying(255),
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notifications_type_check CHECK (((type)::text = ANY ((ARRAY['session'::character varying, 'resource'::character varying, 'friend_request'::character varying, 'group_recommendation'::character varying])::text[])))
);


ALTER TABLE public.notifications OWNER TO stackkens;

--
-- Name: resources; Type: TABLE; Schema: public; Owner: stackkens
--

CREATE TABLE public.resources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    url text NOT NULL,
    uploaded_by uuid NOT NULL,
    downloads integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT resources_type_check CHECK (((type)::text = ANY ((ARRAY['pdf'::character varying, 'link'::character varying, 'video'::character varying, 'document'::character varying])::text[])))
);


ALTER TABLE public.resources OWNER TO stackkens;

--
-- Name: session_attendees; Type: TABLE; Schema: public; Owner: stackkens
--

CREATE TABLE public.session_attendees (
    session_id uuid NOT NULL,
    user_id uuid NOT NULL
);


ALTER TABLE public.session_attendees OWNER TO stackkens;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: stackkens
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    meet_link character varying(255)
);


ALTER TABLE public.sessions OWNER TO stackkens;

--
-- Name: users; Type: TABLE; Schema: public; Owner: stackkens
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    university character varying(255) NOT NULL,
    course character varying(255) NOT NULL,
    year_of_study integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    bio text,
    avatar_url text,
    CONSTRAINT users_year_of_study_check CHECK (((year_of_study >= 1) AND (year_of_study <= 6)))
);


ALTER TABLE public.users OWNER TO stackkens;

--
-- Data for Name: friendships; Type: TABLE DATA; Schema: public; Owner: stackkens
--

COPY public.friendships (user_id, friend_id, status, created_at) FROM stdin;
40f09c5d-e30f-4f30-91ad-4cb641ffe832	cb656772-00d2-4011-8de2-e0ecc26c0f07	pending	2026-05-22 12:52:42.69418+03
76ca4002-9a81-49c5-a60a-f2cc86f5db76	40f09c5d-e30f-4f30-91ad-4cb641ffe832	accepted	2026-05-22 14:01:15.263169+03
40f09c5d-e30f-4f30-91ad-4cb641ffe832	ed2137b4-12d3-47e3-8408-faa0a5c1dd9d	accepted	2026-05-22 12:52:45.916212+03
\.


--
-- Data for Name: group_members; Type: TABLE DATA; Schema: public; Owner: stackkens
--

COPY public.group_members (user_id, group_id, role, joined_at) FROM stdin;
cb656772-00d2-4011-8de2-e0ecc26c0f07	3944b2b2-ef26-452c-9dd5-060cb2f1ba65	admin	2026-05-21 16:53:30.120095+03
40f09c5d-e30f-4f30-91ad-4cb641ffe832	183b7942-2f80-4d91-ba33-6d399eab0dd4	admin	2026-05-22 10:22:00.49898+03
76ca4002-9a81-49c5-a60a-f2cc86f5db76	e2603b9c-f893-47e5-a6b6-0eaf9ba909cd	admin	2026-05-22 14:03:34.38242+03
76ca4002-9a81-49c5-a60a-f2cc86f5db76	3944b2b2-ef26-452c-9dd5-060cb2f1ba65	member	2026-05-22 14:28:18.920316+03
76ca4002-9a81-49c5-a60a-f2cc86f5db76	183b7942-2f80-4d91-ba33-6d399eab0dd4	member	2026-05-22 14:28:21.25449+03
76ca4002-9a81-49c5-a60a-f2cc86f5db76	b5ea353e-79e4-4d22-b26a-752d531c46b3	member	2026-05-22 14:28:22.524663+03
40f09c5d-e30f-4f30-91ad-4cb641ffe832	e2603b9c-f893-47e5-a6b6-0eaf9ba909cd	member	2026-05-22 14:51:31.099984+03
40f09c5d-e30f-4f30-91ad-4cb641ffe832	3944b2b2-ef26-452c-9dd5-060cb2f1ba65	member	2026-05-22 15:46:59.299446+03
40f09c5d-e30f-4f30-91ad-4cb641ffe832	b5ea353e-79e4-4d22-b26a-752d531c46b3	member	2026-05-22 16:10:11.7724+03
ed2137b4-12d3-47e3-8408-faa0a5c1dd9d	3944b2b2-ef26-452c-9dd5-060cb2f1ba65	member	2026-05-22 17:22:02.534383+03
ed2137b4-12d3-47e3-8408-faa0a5c1dd9d	b5ea353e-79e4-4d22-b26a-752d531c46b3	member	2026-05-22 17:22:14.542517+03
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: stackkens
--

COPY public.groups (id, name, description, subject, university, created_by, created_at) FROM stdin;
3944b2b2-ef26-452c-9dd5-060cb2f1ba65	Data Structures & Algorithms	Weekly DSA problem solving	CS 301	Makerere University	cb656772-00d2-4011-8de2-e0ecc26c0f07	2026-05-21 16:53:30.099665+03
b5ea353e-79e4-4d22-b26a-752d531c46b3	Data Structures & Algorithms	Weekly DSA problem solving	CS 301	Makerere University	40f09c5d-e30f-4f30-91ad-4cb641ffe832	2026-05-21 16:56:51.326967+03
183b7942-2f80-4d91-ba33-6d399eab0dd4	Datasturcture group	this is a group for serious students	AI	Makerere University	40f09c5d-e30f-4f30-91ad-4cb641ffe832	2026-05-22 10:22:00.489558+03
e2603b9c-f893-47e5-a6b6-0eaf9ba909cd	Medicine group	This is fro medicine students	Medicine	Ndejje University	76ca4002-9a81-49c5-a60a-f2cc86f5db76	2026-05-22 14:03:34.373173+03
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: stackkens
--

COPY public.notifications (id, user_id, type, title, message, link, read, created_at) FROM stdin;
\.


--
-- Data for Name: resources; Type: TABLE DATA; Schema: public; Owner: stackkens
--

COPY public.resources (id, group_id, title, type, url, uploaded_by, downloads, created_at) FROM stdin;
08d68eec-47b5-419c-ac4a-1468b72957cc	3944b2b2-ef26-452c-9dd5-060cb2f1ba65	Big O Cheatsheet	pdf	https://example.com/big-o.pdf	cb656772-00d2-4011-8de2-e0ecc26c0f07	0	2026-05-21 16:53:30.14228+03
cb622fa7-74a5-48ab-840c-f5f9e3e1d701	e2603b9c-f893-47e5-a6b6-0eaf9ba909cd	Medicine Comprehensive notes	document	https://res.cloudinary.com/db0oxbeck/raw/upload/v1779447850/jmtaw9jfgkeelffrb3by.pptx	76ca4002-9a81-49c5-a60a-f2cc86f5db76	2	2026-05-22 14:04:10.948572+03
6b794648-6eea-4573-91c9-68b22b6098b4	183b7942-2f80-4d91-ba33-6d399eab0dd4	Lecture20	pdf	https://res.cloudinary.com/db0oxbeck/image/upload/v1779439384/yq6lhpseh92vqwbcjblx.pdf	40f09c5d-e30f-4f30-91ad-4cb641ffe832	1	2026-05-22 11:43:05.424047+03
\.


--
-- Data for Name: session_attendees; Type: TABLE DATA; Schema: public; Owner: stackkens
--

COPY public.session_attendees (session_id, user_id) FROM stdin;
b31c8f96-90b6-43c2-bd4b-bff5bb3f2364	cb656772-00d2-4011-8de2-e0ecc26c0f07
b31c8f96-90b6-43c2-bd4b-bff5bb3f2364	40f09c5d-e30f-4f30-91ad-4cb641ffe832
92b05a64-88cf-456b-a6bf-72070150ff2b	76ca4002-9a81-49c5-a60a-f2cc86f5db76
92b05a64-88cf-456b-a6bf-72070150ff2b	40f09c5d-e30f-4f30-91ad-4cb641ffe832
c4b320ca-991f-4b3a-ab05-d37fc473a599	40f09c5d-e30f-4f30-91ad-4cb641ffe832
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: stackkens
--

COPY public.sessions (id, group_id, title, start_time, end_time, created_by, created_at, meet_link) FROM stdin;
b31c8f96-90b6-43c2-bd4b-bff5bb3f2364	3944b2b2-ef26-452c-9dd5-060cb2f1ba65	Array & String Problems	2026-05-21 16:53:30.13016+03	2026-05-21 18:53:30.13016+03	cb656772-00d2-4011-8de2-e0ecc26c0f07	2026-05-21 16:53:30.13016+03	\N
92b05a64-88cf-456b-a6bf-72070150ff2b	e2603b9c-f893-47e5-a6b6-0eaf9ba909cd	Medicine review	2026-05-22 18:05:00+03	2026-05-22 20:05:00+03	76ca4002-9a81-49c5-a60a-f2cc86f5db76	2026-05-22 14:05:50.006475+03	\N
c4b320ca-991f-4b3a-ab05-d37fc473a599	183b7942-2f80-4d91-ba33-6d399eab0dd4	DSA	2026-05-22 20:23:00+03	2026-05-22 20:25:00+03	40f09c5d-e30f-4f30-91ad-4cb641ffe832	2026-05-22 20:23:38.688067+03	https://meet.google.com/zrb-wdfx-cxd
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: stackkens
--

COPY public.users (id, name, email, password_hash, university, course, year_of_study, created_at, bio, avatar_url) FROM stdin;
cb656772-00d2-4011-8de2-e0ecc26c0f07	alexofwono	alex@gmail.com	alex256uganda	Makerere University	Computer Science	2	2026-05-21 11:58:11.18946+03	\N	\N
6088a4ac-5905-45f9-bae4-be7ba6d3e64a	TestUser	test@example.com	fakehash123	TestUni	TestCourse	1	2026-05-21 13:57:33.146563+03	\N	\N
b57dab41-33bb-4af8-be28-2ae1788bfd83	John Doe	john@example.com	$2b$12$BFHmtP2vGMArULJDNU0xRupvQHfrEygaIHSjmMDg3V/day8VDQK7e	MIT	Computer Science	3	2026-05-21 14:08:19.179862+03	\N	\N
ed2137b4-12d3-47e3-8408-faa0a5c1dd9d	Ofwono Alex	okello@gmail.com	$2b$12$Pd7luf03bJkDGvRlxH/vYe8.V2b9OPcR8zBq7EFgM5.jiE/BVe/wW	Kyambogo University	Software Engineering	1	2026-05-21 15:55:40.179253+03	\N	\N
40f09c5d-e30f-4f30-91ad-4cb641ffe832	alex okello	alexx@gmail.com	$2b$12$qse117/vK/7GThMrFVBUdOTWhZ1i/JuhNpoe.Uk1HTR4L5sOVRQH6	Kyambogo University	Law	3	2026-05-21 16:47:57.088224+03	\N	https://res.cloudinary.com/db0oxbeck/image/upload/v1779444525/rqxju3vzrokbvwubhzmh.png
76ca4002-9a81-49c5-a60a-f2cc86f5db76	kent	kent@gmail.com	$2b$12$j150eVRCDJO2v1ILVSmhFuUpeIrd9bPH6lFBp2cFOpwn5OWeeP4US	Ndejje University	Information Technology	4	2026-05-22 13:59:24.532619+03	I love medicine	https://res.cloudinary.com/db0oxbeck/image/upload/v1779447596/scnay5dfgjwvcb6imozs.jpg
\.


--
-- Name: friendships friendships_pkey; Type: CONSTRAINT; Schema: public; Owner: stackkens
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_pkey PRIMARY KEY (user_id, friend_id);


--
-- Name: group_members group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: stackkens
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_pkey PRIMARY KEY (user_id, group_id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: stackkens
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: stackkens
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: resources resources_pkey; Type: CONSTRAINT; Schema: public; Owner: stackkens
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (id);


--
-- Name: session_attendees session_attendees_pkey; Type: CONSTRAINT; Schema: public; Owner: stackkens
--

ALTER TABLE ONLY public.session_attendees
    ADD CONSTRAINT session_attendees_pkey PRIMARY KEY (session_id, user_id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: stackkens
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: stackkens
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: stackkens
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_friendships_user; Type: INDEX; Schema: public; Owner: stackkens
--

CREATE INDEX idx_friendships_user ON public.friendships USING btree (user_id);


--
-- Name: idx_group_members_group; Type: INDEX; Schema: public; Owner: stackkens
--

CREATE INDEX idx_group_members_group ON public.group_members USING btree (group_id);


--
-- Name: idx_group_members_user; Type: INDEX; Schema: public; Owner: stackkens
--

CREATE INDEX idx_group_members_user ON public.group_members USING btree (user_id);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: stackkens
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (user_id, read);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: stackkens
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);


--
-- Name: idx_resources_group; Type: INDEX; Schema: public; Owner: stackkens
--

CREATE INDEX idx_resources_group ON public.resources USING btree (group_id);


--
-- Name: idx_sessions_group; Type: INDEX; Schema: public; Owner: stackkens
--

CREATE INDEX idx_sessions_group ON public.sessions USING btree (group_id);


--
-- Name: friendships friendships_friend_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stackkens
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_friend_id_fkey FOREIGN KEY (friend_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: friendships friendships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stackkens
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: group_members group_members_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stackkens
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: group_members group_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stackkens
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: groups groups_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stackkens
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stackkens
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: resources resources_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stackkens
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: resources resources_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stackkens
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: session_attendees session_attendees_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stackkens
--

ALTER TABLE ONLY public.session_attendees
    ADD CONSTRAINT session_attendees_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: session_attendees session_attendees_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stackkens
--

ALTER TABLE ONLY public.session_attendees
    ADD CONSTRAINT session_attendees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stackkens
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: sessions sessions_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stackkens
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict IQyk96LcdhMHuxE3CGdveS86vTSrgLRxhrzAbbfBtkIxYI2jThiNxMxiLaIuo7X

