import { GoogleSignInButton } from "./auth-buttons";

function WoditSymbol() {
  return (
    <div className="relative h-28 w-28">
      <div className="absolute left-1/2 top-1 -translate-x-1/2">
        <div className="relative h-10 w-10">
          <span className="absolute left-0 top-2 h-6 w-4 rotate-[-18deg] rounded-[999px_999px_999px_0] bg-[#69d68d]" />
          <span className="absolute right-0 top-0 h-6 w-4 rotate-[18deg] rounded-[999px_999px_0_999px] bg-[#3fc870]" />
        </div>
      </div>
      <div className="absolute bottom-0 left-1/2 h-20 w-20 -translate-x-1/2 rounded-[28px] bg-[linear-gradient(180deg,#5ed0c2_0%,#2c8fb2_100%)] [clip-path:path('M15_8_C8_8,5_14,5_24_c0_14,10_27,24_44_c14-17,24-30,24-44_C53_14,46_8,39_8_c-7_0-11_4-15_10_C20_12,20_8,15_8z')]" />
      <div className="absolute bottom-3 left-1/2 h-11 w-11 -translate-x-1/2 rounded-full border-[10px] border-white/85 border-t-transparent border-r-transparent rotate-[-36deg]" />
    </div>
  );
}

export function SignInScreen() {
  return (
    <main className="signin-stage relative min-h-screen overflow-hidden px-4 py-6 sm:px-6">
      <div className="rain-layer" />
      <div className="rain-drops" />

      <section className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-[920px] items-center justify-center gap-1 lg:gap-0">
        <div className="relative z-10 hidden flex-1 lg:flex">
          <div className="ml-8 flex max-w-[300px] flex-col items-center text-center text-[#20485f]">
            <WoditSymbol />
            <p className="mt-5 text-lg font-semibold tracking-[-0.04em] text-[#1c4f67]">
              오늘 날씨에 맞는 완벽한 스타일 제안
            </p>
            <p className="mt-3 text-sm leading-6 text-[#315f74]">
              비 오는 날의 무드와 당신의 체감 온도를 함께 반영해
              <br />
              더 자연스럽고 정확한 코디를 추천합니다.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex w-full justify-center lg:-ml-2 lg:w-auto lg:justify-start">
          <div className="w-full max-w-[290px] rounded-[1.2rem] border border-white/55 bg-[linear-gradient(180deg,rgba(232,247,252,0.95),rgba(220,241,249,0.92))] px-4 py-5 shadow-[0_14px_28px_rgba(81,145,172,0.1)] backdrop-blur-xl">
            <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
              <h1 className="text-[1.9rem] font-black tracking-[-0.06em] text-[#1f5874]">
                Wodit
              </h1>
              <p className="mt-3 text-[0.92rem] font-bold tracking-[-0.04em] text-[#223d4d]">
                당신의 날씨 맞춤 코디 플레이너
              </p>
              <p className="mt-2 text-[11px] leading-5 text-[#3d6176]">
                매일 날씨에 어울리는 최적의 스타일을 추천해드립니다.
                <br />
                Google로 로그인하여 확인하세요.
              </p>

              <div className="mt-5 w-full max-w-[230px]">
                <GoogleSignInButton />
              </div>

              <p className="mt-5 text-[10px] text-[#537488]">
                날씨 기반 코디 추천 서비스
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
