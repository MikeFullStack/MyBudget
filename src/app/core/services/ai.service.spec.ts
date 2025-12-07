import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiService } from './ai.service';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';

// Mock Firebase dependencies
vi.mock('firebase/ai', () => {
    return {
        getAI: vi.fn(),
        getGenerativeModel: vi.fn(),
        GoogleAIBackend: vi.fn()
    };
});

vi.mock('../firebase-init', () => ({
    app: { name: 'mock-app' }
}));

describe('AiService', () => {
    let service: AiService;
    let mockGenerateContent: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup mock response
        mockGenerateContent = vi.fn().mockResolvedValue({
            response: {
                text: () => 'Analysis Result'
            }
        });

        // Setup getGenerativeModel to return an object with generateContent
        (getGenerativeModel as any).mockReturnValue({
            generateContent: mockGenerateContent
        });

        service = new AiService();
    });

    it('should initialize with GoogleAIBackend', () => {
        // expect getAI to have been called with backend option
        // expect(getAI).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ backend: expect.any(GoogleAIBackend) }));

        // Note: expect.anything() fails on undefined, so if app is undefined due to mocking, this might fail.
        // Let's check call arguments directly if needed.
        const calls = (getAI as any).mock.calls;
        expect(calls[0][1]).toEqual(expect.objectContaining({ backend: expect.any(GoogleAIBackend) }));
    });

    it('should call generateContent with correct prompt', async () => {
        const budgetContext = { income: 5000, outcome: 3000 };
        const result = await service.analyzeBudget(budgetContext);

        expect(result).toBe('Analysis Result');
        expect(mockGenerateContent).toHaveBeenCalledTimes(1);

        // Check prompt content
        const calledPrompt = mockGenerateContent.mock.calls[0][0];
        expect(calledPrompt).toContain('expert financier');
        expect(calledPrompt).toContain('"income":5000');
    });

    it('should handle errors gracefully', async () => {
        const error = new Error('API Error');
        mockGenerateContent.mockRejectedValue(error);

        await expect(service.analyzeBudget({})).rejects.toThrow('API Error');
    });

    it('should call askAdvisor with correct prompt', async () => {
        const result = await service.askAdvisor({ income: 100 }, 'How much?');
        expect(result).toBe('Analysis Result');

        const calledPrompt = mockGenerateContent.mock.calls[0][0];
        expect(calledPrompt).toContain('How much?');
        expect(calledPrompt).toContain('"income":100');
    });
});
