export function parseLapTime(value) {
  if (!value) return null;
  const parts = value.split(":");
  let hours = 0,
    minutes = 0,
    secondsPart = "";
  if (parts.length === 3) {
    [hours, minutes, secondsPart] = [
      Number(parts[0]),
      Number(parts[1]),
      parts[2],
    ];
  } else if (parts.length === 2) {
    [minutes, secondsPart] = [Number(parts[0]), parts[1]];
  } else return null;
  const [secondsStr, millisStr = "0"] = secondsPart.split(".");
  const seconds = Number(secondsStr);
  const millis = Number(millisStr.padEnd(3, "0"));
  if ([hours, minutes, seconds, millis].some(Number.isNaN)) return null;
  return ((hours * 60 + minutes) * 60 + seconds) * 1000 + millis;
}
