/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@gini/shared', '@gini/supabase', '@gini/ui'],
};

module.exports = nextConfig;
