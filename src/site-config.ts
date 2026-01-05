export const SiteConfig = {
  title: "DevFlow",
  description:
    "Productivity system for developers - Time-blocking, AI insights, War Room",
  prodUrl: "https://devflow.app", // TODO: Update with real domain
  appId: "devflow",
  domain: "devflow.app", // TODO: Update with real domain
  appIcon: "/images/icon.png",
  company: {
    name: "DevFlow",
    address: "France",
  },
  brand: {
    primary: "#007291", // TODO: Update DevFlow brand color
  },
  team: {
    image: "https://placeholder.com/150", // TODO: Update with your profile
    website: "https://devflow.app", // TODO: Update with your website
    twitter: "https://twitter.com/devflow", // TODO: Update with your twitter
    name: "DevFlow Team",
  },
  features: {
    /**
     * If enable, you need to specify the logic of upload here : src/features/images/uploadImageAction.tsx
     * You can use Vercel Blob Storage : https://vercel.com/docs/storage/vercel-blob
     * Or you can use Cloudflare R2 : https://mlv.sh/cloudflare-r2-tutorial
     * Or you can use AWS S3 : https://mlv.sh/aws-s3-tutorial
     */
    enableImageUpload: false as boolean,
    /**
     * DevFlow: App requires authentication
     * If user is logged in, redirect to /app
     * If user is not logged in, redirect to /auth/signin
     * No public landing page
     */
    enableLandingRedirection: false as boolean,
  },
};
