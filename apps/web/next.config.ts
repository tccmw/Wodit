import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@wodit/types", "@wodit/utils"]
};

export default nextConfig;
