-- ✅ Market News Helper - Supabase 테이블 생성 SQL
-- Supabase 대시보드 → SQL Editor에서 실행하세요.

-- 1. 히스토리 테이블
CREATE TABLE IF NOT EXISTS history (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  date TEXT NOT NULL,
  keyword TEXT,
  summary TEXT,
  analysis TEXT,
  sentiment TEXT DEFAULT 'neutral',
  commentary TEXT NOT NULL
);

-- 2. 즐겨찾기 테이블
CREATE TABLE IF NOT EXISTS favorites (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  keyword TEXT UNIQUE NOT NULL
);

-- 3. RLS (Row Level Security) - anon 키로 읽기/쓰기 허용
ALTER TABLE history ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to history" ON history
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to favorites" ON favorites
  FOR ALL USING (true) WITH CHECK (true);

-- 4. 기본 즐겨찾기 삽입
INSERT INTO favorites (keyword) VALUES
  ('전력인프라'),
  ('ESS'),
  ('반도체'),
  ('HD현대일렉트릭'),
  ('K방산'),
  ('연준 금리')
ON CONFLICT (keyword) DO NOTHING;
