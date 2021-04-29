import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1618285267711 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
--
-- PostgreSQL database dump
--

-- Dumped from database version 13.2
-- Dumped by pg_dump version 13.2

-- Started on 2021-04-13 11:00:22 +07

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 200 (class 1259 OID 24876)
-- Name: account; Type: TABLE; Schema: public; Owner: nodle
--

CREATE TABLE public.account (
    account_id integer NOT NULL,
    address character varying NOT NULL,
    nonce integer,
    refcount integer
);



--
-- TOC entry 201 (class 1259 OID 24882)
-- Name: account_account_id_seq; Type: SEQUENCE; Schema: public; Owner: nodle
--

CREATE SEQUENCE public.account_account_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 3104 (class 0 OID 0)
-- Dependencies: 201
-- Name: account_account_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nodle
--

ALTER SEQUENCE public.account_account_id_seq OWNED BY public.account.account_id;


--
-- TOC entry 202 (class 1259 OID 24884)
-- Name: application; Type: TABLE; Schema: public; Owner: nodle
--

CREATE TABLE public.application (
    application_id integer NOT NULL,
    block_id integer NOT NULL,
    candidate character varying NOT NULL,
    candidate_deposit numeric,
    metadata character varying,
    challenger character varying,
    challenger_deposit numeric,
    votes_for character varying,
    voters_for character varying[] NOT NULL,
    votes_against character varying,
    voters_against character varying[] NOT NULL,
    created_block bigint,
    challenged_block bigint,
    status character varying
);



--
-- TOC entry 203 (class 1259 OID 24890)
-- Name: application_application_id_seq; Type: SEQUENCE; Schema: public; Owner: nodle
--

CREATE SEQUENCE public.application_application_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 3105 (class 0 OID 0)
-- Dependencies: 203
-- Name: application_application_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nodle
--

ALTER SEQUENCE public.application_application_id_seq OWNED BY public.application.application_id;


--
-- TOC entry 204 (class 1259 OID 24892)
-- Name: backfill_progress; Type: TABLE; Schema: public; Owner: nodle
--

CREATE TABLE public.backfill_progress (
    backfill_progress_id integer NOT NULL,
    last_block_number bigint NOT NULL,
    per_page integer
);



--
-- TOC entry 205 (class 1259 OID 24895)
-- Name: backfill_progress_backfill_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: nodle
--

CREATE SEQUENCE public.backfill_progress_backfill_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 3106 (class 0 OID 0)
-- Dependencies: 205
-- Name: backfill_progress_backfill_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nodle
--

ALTER SEQUENCE public.backfill_progress_backfill_progress_id_seq OWNED BY public.backfill_progress.backfill_progress_id;


--
-- TOC entry 206 (class 1259 OID 24897)
-- Name: balance; Type: TABLE; Schema: public; Owner: nodle
--

CREATE TABLE public.balance (
    balance_id integer NOT NULL,
    free bigint NOT NULL,
    reserved bigint NOT NULL,
    misc_frozen bigint,
    fee_frozen bigint,
    account_id integer,
    block_id integer NOT NULL
);



--
-- TOC entry 207 (class 1259 OID 24903)
-- Name: balance_balance_id_seq; Type: SEQUENCE; Schema: public; Owner: nodle
--

CREATE SEQUENCE public.balance_balance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 3107 (class 0 OID 0)
-- Dependencies: 207
-- Name: balance_balance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nodle
--

ALTER SEQUENCE public.balance_balance_id_seq OWNED BY public.balance.balance_id;


--
-- TOC entry 208 (class 1259 OID 24905)
-- Name: block; Type: TABLE; Schema: public; Owner: nodle
--

CREATE TABLE public.block (
    block_id integer NOT NULL,
    number bigint NOT NULL,
    "timestamp" timestamp without time zone NOT NULL,
    hash character varying(66) NOT NULL,
    parent_hash character varying(66) NOT NULL,
    state_root character varying(66) NOT NULL,
    extrinsics_root character varying(66) NOT NULL,
    spec_version integer NOT NULL,
    finalized boolean DEFAULT false NOT NULL
);



--
-- TOC entry 209 (class 1259 OID 24909)
-- Name: block_block_id_seq; Type: SEQUENCE; Schema: public; Owner: nodle
--

CREATE SEQUENCE public.block_block_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 3108 (class 0 OID 0)
-- Dependencies: 209
-- Name: block_block_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nodle
--

ALTER SEQUENCE public.block_block_id_seq OWNED BY public.block.block_id;


--
-- TOC entry 210 (class 1259 OID 24911)
-- Name: event; Type: TABLE; Schema: public; Owner: nodle
--

CREATE TABLE public.event (
    event_id integer NOT NULL,
    index smallint NOT NULL,
    extrinsic_hash character varying,
    module_name character varying NOT NULL,
    event_name character varying NOT NULL,
    block_id integer NOT NULL,
    data jsonb,
    type character varying,
    extrinsic_id integer
);



--
-- TOC entry 211 (class 1259 OID 24917)
-- Name: event_event_id_seq; Type: SEQUENCE; Schema: public; Owner: nodle
--

CREATE SEQUENCE public.event_event_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 3109 (class 0 OID 0)
-- Dependencies: 211
-- Name: event_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nodle
--

ALTER SEQUENCE public.event_event_id_seq OWNED BY public.event.event_id;


--
-- TOC entry 212 (class 1259 OID 24919)
-- Name: extrinsic; Type: TABLE; Schema: public; Owner: nodle
--

CREATE TABLE public.extrinsic (
    extrinsic_id integer NOT NULL,
    index integer NOT NULL,
    block_id integer NOT NULL,
    length integer NOT NULL,
    version_info character varying NOT NULL,
    call_code character varying NOT NULL,
    call_module_function character varying NOT NULL,
    call_module character varying NOT NULL,
    params text NOT NULL,
    signer character varying,
    signature character varying,
    nonce integer,
    era character varying,
    hash character varying NOT NULL,
    is_signed boolean DEFAULT false NOT NULL,
    success boolean DEFAULT false NOT NULL
);



--
-- TOC entry 213 (class 1259 OID 24927)
-- Name: extrinsic_extrinsic_id_seq; Type: SEQUENCE; Schema: public; Owner: nodle
--

CREATE SEQUENCE public.extrinsic_extrinsic_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 3110 (class 0 OID 0)
-- Dependencies: 213
-- Name: extrinsic_extrinsic_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nodle
--

ALTER SEQUENCE public.extrinsic_extrinsic_id_seq OWNED BY public.extrinsic.extrinsic_id;


--
-- TOC entry 214 (class 1259 OID 24929)
-- Name: log; Type: TABLE; Schema: public; Owner: nodle
--

CREATE TABLE public.log (
    log_id integer NOT NULL,
    block_id integer NOT NULL,
    index character varying NOT NULL,
    type character varying NOT NULL,
    data text NOT NULL,
    is_finalized boolean DEFAULT false NOT NULL
);



--
-- TOC entry 3111 (class 0 OID 0)
-- Dependencies: 214
-- Name: COLUMN log.type; Type: COMMENT; Schema: public; Owner: nodle
--

COMMENT ON COLUMN public.log.type IS 'Index type';


--
-- TOC entry 215 (class 1259 OID 24936)
-- Name: log_log_id_seq; Type: SEQUENCE; Schema: public; Owner: nodle
--

CREATE SEQUENCE public.log_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 3112 (class 0 OID 0)
-- Dependencies: 215
-- Name: log_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nodle
--

ALTER SEQUENCE public.log_log_id_seq OWNED BY public.log.log_id;


--
-- TOC entry 216 (class 1259 OID 24946)
-- Name: root_certificate; Type: TABLE; Schema: public; Owner: nodle
--

CREATE TABLE public.root_certificate (
    root_certificate_id integer NOT NULL,
    block_id integer NOT NULL,
    owner character varying NOT NULL,
    key character varying NOT NULL,
    revoked boolean DEFAULT false NOT NULL,
    child_revocations character varying[],
    created bigint,
    renewed bigint,
    validity bigint
);


--
-- TOC entry 217 (class 1259 OID 24953)
-- Name: root_certificate_root_certificate_id_seq; Type: SEQUENCE; Schema: public; Owner: nodle
--

CREATE SEQUENCE public.root_certificate_root_certificate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 3114 (class 0 OID 0)
-- Dependencies: 217
-- Name: root_certificate_root_certificate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nodle
--

ALTER SEQUENCE public.root_certificate_root_certificate_id_seq OWNED BY public.root_certificate.root_certificate_id;


--
-- TOC entry 218 (class 1259 OID 24955)
-- Name: vesting_schedule; Type: TABLE; Schema: public; Owner: nodle
--

CREATE TABLE public.vesting_schedule (
    vesting_schedule_id integer NOT NULL,
    block_id integer NOT NULL,
    start bigint NOT NULL,
    period bigint NOT NULL,
    period_count integer NOT NULL,
    per_period bigint DEFAULT 0 NOT NULL,
    account_address character varying NOT NULL,
    status character varying
);



--
-- TOC entry 3115 (class 0 OID 0)
-- Dependencies: 218
-- Name: COLUMN vesting_schedule.per_period; Type: COMMENT; Schema: public; Owner: nodle
--

COMMENT ON COLUMN public.vesting_schedule.per_period IS 'Balance';


--
-- TOC entry 219 (class 1259 OID 24962)
-- Name: vesting_schedule_vesting_schedule_id_seq; Type: SEQUENCE; Schema: public; Owner: nodle
--

CREATE SEQUENCE public.vesting_schedule_vesting_schedule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 3116 (class 0 OID 0)
-- Dependencies: 219
-- Name: vesting_schedule_vesting_schedule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nodle
--

ALTER SEQUENCE public.vesting_schedule_vesting_schedule_id_seq OWNED BY public.vesting_schedule.vesting_schedule_id;


--
-- TOC entry 2918 (class 2604 OID 24964)
-- Name: account account_id; Type: DEFAULT; Schema: public; Owner: nodle
--

ALTER TABLE ONLY public.account ALTER COLUMN account_id SET DEFAULT nextval('public.account_account_id_seq'::regclass);


--
-- TOC entry 2919 (class 2604 OID 24965)
-- Name: application application_id; Type: DEFAULT; Schema: public; Owner: nodle
--

ALTER TABLE ONLY public.application ALTER COLUMN application_id SET DEFAULT nextval('public.application_application_id_seq'::regclass);


--
-- TOC entry 2920 (class 2604 OID 24966)
-- Name: backfill_progress backfill_progress_id; Type: DEFAULT; Schema: public; Owner: nodle
--

ALTER TABLE ONLY public.backfill_progress ALTER COLUMN backfill_progress_id SET DEFAULT nextval('public.backfill_progress_backfill_progress_id_seq'::regclass);


--
-- TOC entry 2921 (class 2604 OID 24967)
-- Name: balance balance_id; Type: DEFAULT; Schema: public; Owner: nodle
--

ALTER TABLE ONLY public.balance ALTER COLUMN balance_id SET DEFAULT nextval('public.balance_balance_id_seq'::regclass);


--
-- TOC entry 2923 (class 2604 OID 24968)
-- Name: block block_id; Type: DEFAULT; Schema: public; Owner: nodle
--

ALTER TABLE ONLY public.block ALTER COLUMN block_id SET DEFAULT nextval('public.block_block_id_seq'::regclass);


--
-- TOC entry 2924 (class 2604 OID 24969)
-- Name: event event_id; Type: DEFAULT; Schema: public; Owner: nodle
--

ALTER TABLE ONLY public.event ALTER COLUMN event_id SET DEFAULT nextval('public.event_event_id_seq'::regclass);


--
-- TOC entry 2927 (class 2604 OID 24970)
-- Name: extrinsic extrinsic_id; Type: DEFAULT; Schema: public; Owner: nodle
--

ALTER TABLE ONLY public.extrinsic ALTER COLUMN extrinsic_id SET DEFAULT nextval('public.extrinsic_extrinsic_id_seq'::regclass);


--
-- TOC entry 2929 (class 2604 OID 24971)
-- Name: log log_id; Type: DEFAULT; Schema: public; Owner: nodle
--

ALTER TABLE ONLY public.log ALTER COLUMN log_id SET DEFAULT nextval('public.log_log_id_seq'::regclass);


--
-- TOC entry 2931 (class 2604 OID 24973)
-- Name: root_certificate root_certificate_id; Type: DEFAULT; Schema: public; Owner: nodle
--

ALTER TABLE ONLY public.root_certificate ALTER COLUMN root_certificate_id SET DEFAULT nextval('public.root_certificate_root_certificate_id_seq'::regclass);


--
-- TOC entry 2933 (class 2604 OID 24974)
-- Name: vesting_schedule vesting_schedule_id; Type: DEFAULT; Schema: public; Owner: nodle
--

ALTER TABLE ONLY public.vesting_schedule ALTER COLUMN vesting_schedule_id SET DEFAULT nextval('public.vesting_schedule_vesting_schedule_id_seq'::regclass);


--
-- TOC entry 2946 (class 2606 OID 24976)
-- Name: block PK_042f4b488f715ee1c97853a4a74; Type: CONSTRAINT; Schema: public; Owner: nodle
--

ALTER TABLE ONLY public.block
    ADD CONSTRAINT "PK_042f4b488f715ee1c97853a4a74" PRIMARY KEY (block_id);


--
-- TOC entry 2950 (class 2606 OID 24978)
-- Name: event PK_2403d4f25e3671e42901eb1a2f2; Type: CONSTRAINT; Schema: public; Owner: nodle
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT "PK_2403d4f25e3671e42901eb1a2f2" PRIMARY KEY (event_id);


--
-- TOC entry 2936 (class 2606 OID 24982)
-- Name: account account_pk; Type: CONSTRAINT; Schema: public; Owner: nodle
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_pk PRIMARY KEY (account_id);


--
-- TOC entry 2938 (class 2606 OID 24984)
-- Name: application application_pk; Type: CONSTRAINT; Schema: public; Owner: nodle
--

ALTER TABLE ONLY public.application
    ADD CONSTRAINT application_pk PRIMARY KEY (application_id);


--
-- TOC entry 2940 (class 2606 OID 24986)
-- Name: backfill_progress backfill_progress_pk; Type: CONSTRAINT; Schema: public; Owner: nodle
--

ALTER TABLE ONLY public.backfill_progress
    ADD CONSTRAINT backfill_progress_pk PRIMARY KEY (backfill_progress_id);


--
-- TOC entry 2942 (class 2606 OID 24988)
-- Name: balance balance_pk; Type: CONSTRAINT; Schema: public; Owner: nodle
--

ALTER TABLE ONLY public.balance
    ADD CONSTRAINT balance_pk PRIMARY KEY (balance_id);


--
-- TOC entry 2953 (class 2606 OID 24990)
-- Name: extrinsic extrinsic_pk; Type: CONSTRAINT; Schema: public; Owner: nodle
--

ALTER TABLE ONLY public.extrinsic
    ADD CONSTRAINT extrinsic_pk PRIMARY KEY (extrinsic_id);


--
-- TOC entry 2955 (class 2606 OID 24992)
-- Name: log log_pk; Type: CONSTRAINT; Schema: public; Owner: nodle
--

ALTER TABLE ONLY public.log
    ADD CONSTRAINT log_pk PRIMARY KEY (log_id);


--
-- TOC entry 2957 (class 2606 OID 24994)
-- Name: root_certificate root_certificate_pk; Type: CONSTRAINT; Schema: public; Owner: nodle
--

ALTER TABLE ONLY public.root_certificate
    ADD CONSTRAINT root_certificate_pk PRIMARY KEY (root_certificate_id);


--
-- TOC entry 2959 (class 2606 OID 24996)
-- Name: vesting_schedule vesting_schedule_pk; Type: CONSTRAINT; Schema: public; Owner: nodle
--

ALTER TABLE ONLY public.vesting_schedule
    ADD CONSTRAINT vesting_schedule_pk PRIMARY KEY (vesting_schedule_id);


--
-- TOC entry 2947 (class 1259 OID 24997)
-- Name: block_pk; Type: INDEX; Schema: public; Owner: nodle
--

CREATE UNIQUE INDEX block_pk ON public.block USING btree (block_id);


--
-- TOC entry 2948 (class 1259 OID 24998)
-- Name: bn_index; Type: INDEX; Schema: public; Owner: nodle
--

CREATE UNIQUE INDEX bn_index ON public.block USING btree (number);


--
-- TOC entry 2951 (class 1259 OID 24999)
-- Name: event_pk; Type: INDEX; Schema: public; Owner: nodle
--

CREATE UNIQUE INDEX event_pk ON public.event USING btree (event_id);


--
-- TOC entry 2943 (class 1259 OID 25000)
-- Name: fki_fk_account_id; Type: INDEX; Schema: public; Owner: nodle
--

CREATE INDEX fki_fk_account_id ON public.balance USING btree (account_id);


--
-- TOC entry 2944 (class 1259 OID 25109)
-- Name: fki_fk_block_id; Type: INDEX; Schema: public; Owner: nodle
--

CREATE INDEX fki_fk_block_id ON public.balance USING btree (block_id);


--
-- TOC entry 2964 (class 2606 OID 25001)
-- Name: event FK_10012d9171f36971af70a610508; Type: FK CONSTRAINT; Schema: public; Owner: nodle
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT "FK_10012d9171f36971af70a610508" FOREIGN KEY (block_id) REFERENCES public.block(block_id);


--
-- TOC entry 2965 (class 2606 OID 25006)
-- Name: extrinsic extrinsic_block_block_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: nodle
--

ALTER TABLE ONLY public.extrinsic
    ADD CONSTRAINT extrinsic_block_block_id_fk FOREIGN KEY (block_id) REFERENCES public.block(block_id);


--
-- TOC entry 2962 (class 2606 OID 25011)
-- Name: balance fk_account_id; Type: FK CONSTRAINT; Schema: public; Owner: nodle
--

ALTER TABLE ONLY public.balance
    ADD CONSTRAINT fk_account_id FOREIGN KEY (account_id) REFERENCES public.account(account_id) NOT VALID;


--
-- TOC entry 2963 (class 2606 OID 25104)
-- Name: balance fk_block_id; Type: FK CONSTRAINT; Schema: public; Owner: nodle
--

ALTER TABLE ONLY public.balance
    ADD CONSTRAINT fk_block_id FOREIGN KEY (block_id) REFERENCES public.block(block_id) NOT VALID;


--
-- TOC entry 2966 (class 2606 OID 25016)
-- Name: log log_block_block_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: nodle
--

ALTER TABLE ONLY public.log
    ADD CONSTRAINT log_block_block_id_fk FOREIGN KEY (block_id) REFERENCES public.block(block_id);


--
-- TOC entry 2967 (class 2606 OID 25021)
-- Name: root_certificate root_certificate_block_block_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: nodle
--

ALTER TABLE ONLY public.root_certificate
    ADD CONSTRAINT root_certificate_block_block_id_fk FOREIGN KEY (block_id) REFERENCES public.block(block_id);


--
-- TOC entry 2968 (class 2606 OID 25026)
-- Name: vesting_schedule vesting_schedule_block_block_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: nodle
--

ALTER TABLE ONLY public.vesting_schedule
    ADD CONSTRAINT vesting_schedule_block_block_id_fk FOREIGN KEY (block_id) REFERENCES public.block(block_id);


-- Completed on 2021-04-13 11:00:53 +07

--
-- PostgreSQL database dump complete
--

    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
