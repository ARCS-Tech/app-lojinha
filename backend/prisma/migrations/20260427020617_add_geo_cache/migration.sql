-- CreateTable
CREATE TABLE "geo_cache" (
    "ip" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "country" TEXT,
    "countryCode" TEXT,
    "continent" TEXT,
    "continentCode" TEXT,
    "region" TEXT,
    "regionName" TEXT,
    "city" TEXT,
    "zip" TEXT,
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,
    "timezone" TEXT,
    "isp" TEXT,
    "org" TEXT,
    "asInfo" TEXT,
    "mobile" BOOLEAN,
    "proxy" BOOLEAN,
    "hosting" BOOLEAN,
    "resolvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geo_cache_pkey" PRIMARY KEY ("ip")
);

-- CreateIndex
CREATE INDEX "geo_cache_resolvedAt_idx" ON "geo_cache"("resolvedAt");
