import { POI, Favorite, SemanticProfile } from '../types';

const INTEREST_ALIASES: Record<string, string[]> = {
  food: ['food', 'restaurant', 'cafe', 'coffee', 'dining'],
  cafe: ['cafe', 'coffee'],
  culture: ['museum', 'historical', 'culture', 'mosque', 'church', 'attraction'],
  nature: ['park', 'nature', 'garden'],
  shopping: ['shopping', 'mall', 'store', 'bazaar'],
  nightlife: ['nightlife', 'bar', 'club'],
  photo: ['instagrammable', 'photo', 'viewpoint'],
  luxury: ['luxury'],
  budget: ['budget'],
};

function haystack(p: POI): string {
  return [p.category, ...(p.moodTags || []), p.description || '']
    .join(' ')
    .toLowerCase();
}

function matchesInterest(p: POI, interest: string): boolean {
  const key = interest.toLowerCase().trim();
  const aliases = INTEREST_ALIASES[key] || [key];
  const h = haystack(p);
  return aliases.some((a) => h.includes(a));
}

/** Heuristic: suitable for current local hour */
export function filterByTimeOfDay(places: POI[], hour = new Date().getHours()): POI[] {
  const h = haystack;
  if (hour >= 6 && hour < 11) {
    return places.filter((p) => /cafe|coffee|breakfast|bakery|park/.test(h(p)));
  }
  if (hour >= 11 && hour < 15) {
    return places.filter((p) => /restaurant|food|cafe|market|museum|attraction/.test(h(p)));
  }
  if (hour >= 15 && hour < 19) {
    return places.filter((p) =>
      /museum|historical|attraction|park|shopping|viewpoint|instagrammable/.test(h(p))
    );
  }
  // evening / night
  return places.filter((p) =>
    /restaurant|food|nightlife|cafe|bar|attraction|shopping/.test(h(p))
  );
}

export function deriveExploreSections(
  places: POI[],
  favorites: Favorite[],
  profile?: SemanticProfile | null
) {
  const interests = profile?.interests || [];

  const nearby = places.slice(0, 24);

  let interestBased =
    interests.length > 0
      ? places.filter((p) => interests.some((i) => matchesInterest(p, i)))
      : places.filter((p) => {
          const style = profile?.travel_style?.toLowerCase();
          if (style) return matchesInterest(p, style);
          return false;
        });
  // Fallback: diversify by category when interests sparse
  if (interestBased.length === 0 && places.length > 0) {
    const seen = new Set<string>();
    interestBased = places.filter((p) => {
      const cat = (p.category || 'other').toLowerCase();
      if (seen.has(cat)) return false;
      seen.add(cat);
      return true;
    }).slice(0, 12);
  }

  const hiddenGems = places.filter(
    (p) =>
      p.moodTags?.some((t) => /hidden|gem|مخفی/.test(t.toLowerCase())) ||
      (p.userRatingCount != null && p.userRatingCount > 0 && p.userRatingCount < 80) ||
      (p.is_curated && (p.userRatingCount == null || p.userRatingCount < 200))
  );

  const budgetFriendly = places.filter(
    (p) =>
      (p.priceLevel != null && p.priceLevel <= 2) ||
      p.moodTags?.some((t) => /budget|cheap|مفت|ارزان/.test(t.toLowerCase())) ||
      /ارزان|budget|cheap/.test((p.localPriceHint || '').toLowerCase()) ||
      (profile?.budget_sensitivity === 'high' && (p.priceLevel == null || p.priceLevel <= 2))
  );

  const popular = [...places]
    .filter((p) => (p.rating ?? 0) >= 4 || (p.userRatingCount ?? 0) >= 100)
    .sort(
      (a, b) =>
        (b.rating ?? 0) * Math.log10((b.userRatingCount ?? 10) + 10) -
        (a.rating ?? 0) * Math.log10((a.userRatingCount ?? 10) + 10)
    )
    .slice(0, 16);

  const forNow = filterByTimeOfDay(places);

  const saved: POI[] = favorites.map((f) => ({
    id: f.placeId,
    name: f.snapshot.name,
    category: f.snapshot.category || 'favorite',
    image: f.snapshot.image,
    lat: f.snapshot.lat ?? 0,
    lng: f.snapshot.lng ?? 0,
    address: f.snapshot.address,
  }));

  return {
    nearby,
    interestBased,
    hiddenGems,
    budgetFriendly,
    popular,
    forNow,
    saved,
  };
}
