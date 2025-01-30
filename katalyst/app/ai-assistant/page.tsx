'use client';
import Sources from '../components/ai-assistant/Sources';
import ChatSection from '../components/ai-assistant/ChatSection';
import PageTemplate from '../components/PageTemplate';
import { AIAssistantProvider } from '../contexts/AIAssistantContext';

export default function AIAssistantPage() {
  return (
    <PageTemplate>
      <AIAssistantProvider>
        <div className="pt-20 lg:pt-[6.3rem] px-4 md:px-8 text-sm md:text-base lg:text-lg" style={{ fontFamily: 'var(--font-courier-prime)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-[288px_1fr] gap-6 max-w-[1400px] mx-auto">
            {/* Left Column - Sources */}
            <div className="bg-[#FFF7DF]">
              <Sources />
            </div>

            {/* Middle Column - Chat */}
            <div className="bg-[#FFF7DF]">
              <ChatSection />
            </div>
          </div>
        </div>
      </AIAssistantProvider>
    </PageTemplate>
  );
}
