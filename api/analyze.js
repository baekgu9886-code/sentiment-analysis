/**
 * ==============================================================================
 * MOMENT 감성 분석 서비스 - 서버리스 API 핸들러
 * 파일명: api/analyze.js
 * 엔드포인트: POST /api/analyze
 * 설명: 클라이언트의 분석 요청을 받아 유효성을 검사하고 OpenAI 및 Supabase를 연동
 * 배포 환경: Vercel Serverless Functions
 * ==============================================================================
 */

import { randomUUID } from 'crypto';
import { analyzeSentiment } from '../lib/openai.js';
import { saveSentimentAnalysis } from '../lib/supabase.js';

/**
 * Vercel Serverless Function 요청 처리 진입점
 * @param {import('http').IncomingMessage} req 
 * @param {import('http').ServerResponse} res 
 */
export default async function handler(req, res) {
    const requestId = randomUUID();

    // 1. HTTP 메서드 검증 (POST 요청만 허용)
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({
            ok: false,
            error: {
                code: 'METHOD_NOT_ALLOWED',
                message: 'POST 요청만 지원합니다.'
            },
            requestId
        });
    }

    try {
        // 2. 요청 본문(body) 유효성 검사
        const body = req.body || {};
        const { text, saveConsent = false } = body;

        // text 필드가 문자열인지 및 길이 검증
        if (typeof text !== 'string') {
            return res.status(400).json({
                ok: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: '입력 내용을 확인해 주세요.'
                },
                requestId
            });
        }

        const trimmedText = text.trim();

        // 빈 문자열이거나 2,000자 초과 시 거절
        if (trimmedText.length === 0 || trimmedText.length > 2000) {
            return res.status(400).json({
                ok: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: '문장은 1자 이상 2,000자 이하로 입력해 주세요.'
                },
                requestId
            });
        }

        // saveConsent 타입 검증
        const consentGiven = Boolean(saveConsent);

        // 3. OpenAI 감성 분석 연동 호출
        const analysisResult = await analyzeSentiment(trimmedText);

        // 4. 선택적 저장 동의 여부에 따라 Supabase 기록 시도
        let isSaved = false;
        if (consentGiven) {
            isSaved = await saveSentimentAnalysis({
                inputText: trimmedText,
                sentiment: analysisResult.sentiment,
                confidence: analysisResult.confidence,
                reason: analysisResult.reason
            });
        }

        // 5. 성공 응답 반환
        return res.status(200).json({
            ok: true,
            result: analysisResult,
            saved: isSaved,
            requestId
        });

    } catch (err) {
        console.error(`[오류 ID: ${requestId}] 감성 분석 처리 실패:`, err.message);

        // 에러 코드별 적절한 HTTP 상태 코드 및 사용자 친화적 메시지 매핑
        let statusCode = 500;
        let errorCode = err.code || 'INTERNAL_ERROR';
        let errorMessage = '일시적인 문제가 발생했어요. 잠시 후 다시 시도해 주세요.';

        if (errorCode === 'AI_UNAVAILABLE') {
            statusCode = 503;
            errorMessage = '분석을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.';
        } else if (errorCode === 'INVALID_AI_RESPONSE') {
            statusCode = 502;
            errorMessage = '결과를 안전하게 처리하지 못했어요. 다시 시도해 주세요.';
        }

        return res.status(statusCode).json({
            ok: false,
            error: {
                code: errorCode,
                message: errorMessage
            },
            requestId
        });
    }
}

