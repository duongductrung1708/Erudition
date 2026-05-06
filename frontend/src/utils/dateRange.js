import dayjs from "dayjs";

const DEFAULT_TZ_OFFSET_HOURS = 7;

export function getApiIsoRange({
  fromDate,
  endDate,
  tzOffsetHours = DEFAULT_TZ_OFFSET_HOURS,
  endIsNowIfToday = true,
}) {
  const now = dayjs();
  const isEndDateToday = endDate?.isSame(now, "day");

  const fromIso = fromDate
    .startOf("day")
    .add(tzOffsetHours, "hour")
    .toISOString();

  const toIso =
    endIsNowIfToday && isEndDateToday
      ? now.toISOString()
      : endDate.endOf("day").add(tzOffsetHours, "hour").toISOString();

  return { fromIso, toIso };
}

export function getInclusiveDayBounds({
  fromDate,
  endDate,
  tzOffsetHours = DEFAULT_TZ_OFFSET_HOURS,
}) {
  return {
    from: fromDate.startOf("day").add(tzOffsetHours, "hour"),
    to: endDate.endOf("day").add(tzOffsetHours, "hour"),
  };
}

