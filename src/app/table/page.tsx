import { faker } from "@faker-js/faker";
import { Suspense } from "react";
import { LABEL_COLORS, type Row, statusOptions } from "./data";
import { TableDemo } from "./TableDemo";

const TEAMS = ["Design", "Engineering", "Growth", "Support"];
const STATUS_IDS = Object.keys(statusOptions) as (keyof typeof statusOptions)[];
// fixed so the rows (and the "x hours ago" dates) don't reshuffle every build
const SEED = 27;
const REFERENCE_DATE = new Date("2026-09-27T12:00:00Z");

// some short, some long, some with line breaks, some empty, so the clamp and
// the expand-over-the-cell popover both get exercised
function makeBio() {
  return faker.helpers.arrayElement([
    "",
    faker.person.bio(),
    faker.company.catchPhrase(),
    faker.helpers.multiple(() => faker.hacker.phrase(), { count: 3 }).join(" "),
    faker.helpers.multiple(() => faker.person.bio(), { count: 3 }).join("\n"),
  ]);
}

function makeRow(): Row {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  return {
    id: `usr_${faker.string.alphanumeric(16).toLowerCase()}`,
    // about a third have no picture, so the initials fallback shows up too
    avatarUrl: faker.helpers.maybe(() => faker.image.avatar(), {
      probability: 0.65,
    }),
    name: `${firstName} ${lastName}`,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    team: faker.helpers.arrayElement(TEAMS),
    url: faker.internet.url(),
    credits: faker.number.int({ max: 5000 }),
    status: faker.helpers.maybe(() => faker.helpers.arrayElement(STATUS_IDS), {
      probability: 0.8,
    }),
    verified: faker.datatype.boolean({ probability: 0.7 }),
    joinedAt: faker.helpers.maybe(
      () => faker.date.recent({ days: 60, refDate: REFERENCE_DATE }),
      { probability: 0.85 },
    ),
    labels: faker.helpers.arrayElements(Object.keys(LABEL_COLORS), {
      min: 0,
      max: 3,
    }),
    bio: makeBio(),
  };
}

// faker runs here on the server so it never ships to the browser
export default function Page() {
  faker.seed(SEED);
  const rows = faker.helpers.multiple(makeRow, { count: 43 });
  const spareRows = faker.helpers.multiple(makeRow, { count: 20 });
  return (
    <Suspense>
      <TableDemo {...{ rows, spareRows }} />
    </Suspense>
  );
}
