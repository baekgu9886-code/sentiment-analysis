-- ==============================================================================
-- 마이그레이션 번호: 001
-- 목적: MOMENT 감성 분석 서비스의 선택적 분석 기록 저장 테이블 생성 및 보안(RLS) 설정
-- 파일 경로: supabase/migrations/001_create_sentiment_analyses_table.sql
-- ==============================================================================

-- 1. 기존 테이블이 존재하지 않을 경우 새로 생성
CREATE TABLE IF NOT EXISTS public.sentiment_analyses (
    -- 고유 식별자 (UUID v4 자동 생성)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 감성 분석 결과 ('positive', 'negative', 'neutral' 중 하나만 저장 가능하도록 제약)
    sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral')),

    -- 신뢰도 백분율 (0부터 100 사이의 정수만 허용)
    confidence SMALLINT NOT NULL CHECK (confidence >= 0 AND confidence <= 100),

    -- 감성 분석 사유 (한국어 설명, 최대 500자 제한)
    reason TEXT NOT NULL CHECK (char_length(reason) <= 500),

    -- 사용자가 입력했던 원문 텍스트 (최대 2,000자 제한)
    input_text TEXT NOT NULL CHECK (char_length(input_text) <= 2000),

    -- 생성 일시 (서버 기준 현재 시각 자동 저장)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 테이블 및 각 컬럼에 대한 상세 설명(Comment) 추가 (관리 및 협업용)
COMMENT ON TABLE public.sentiment_analyses IS '사용자 동의 하에 저장되는 감성 분석 결과 기록 테이블';
COMMENT ON COLUMN public.sentiment_analyses.id IS '분석 기록 고유 식별자 (UUID)';
COMMENT ON COLUMN public.sentiment_analyses.sentiment IS '감성 라벨 (positive, negative, neutral)';
COMMENT ON COLUMN public.sentiment_analyses.confidence IS '모델이 추정한 신뢰도 백분율 (0~100)';
COMMENT ON COLUMN public.sentiment_analyses.reason IS '감성 판정 근거 (최대 500자)';
COMMENT ON COLUMN public.sentiment_analyses.input_text IS '사용자가 입력한 원문 텍스트 (최대 2,000자)';
COMMENT ON COLUMN public.sentiment_analyses.created_at IS '데이터 생성 일시';

-- 3. 빠른 조회를 위한 생성 일시(created_at) 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_sentiment_analyses_created_at 
ON public.sentiment_analyses (created_at DESC);

-- ------------------------------------------------------------------------------
-- 4. 핵심 보안 정책: 행 수준 보안 (Row Level Security, RLS) 활성화
-- ------------------------------------------------------------------------------
-- 테이블의 RLS를 활성화하여 브라우저나 외부에서의 무단 접근을 완벽히 차단합니다.
ALTER TABLE public.sentiment_analyses ENABLE ROW LEVEL SECURITY;

-- 주의: 공개적인 SELECT나 INSERT 허용 정책(POLICY)을 일절 생성하지 않습니다.
-- 이렇게 설정하면 일반 공개 키(anon/public)로는 데이터 조회나 삽입이 전면 차단되며,
-- RLS를 우회할 수 있는 서버의 비공개 키('service_role')를 가진 백엔드 서버리스 함수에서만
-- 안전하게 데이터를 기록할 수 있습니다.

