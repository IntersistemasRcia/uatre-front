const cargoInspector = (cargo) => {
  const value = String(cargo ?? "").trim().toUpperCase();

  return {
    G: "SEC.GENERAL",
    A: "SEC.ADJUNTO",
    C: "SEC.ACTAS",
    S: "SEC.ACC.SOC",
    T: "TESORERO",
    D: "DELEGADO",
    SD: "SUBDELEGADO",
    SUBDELEGADO: "SUBDELEGADO",
  }[value] ?? "-";
};

const respuestaSiNo = (value) => {
  if (value == null || value === "") return "-";

  const normalized = String(value).trim().toUpperCase();
  if (["S", "SI", "SÍ", "TRUE", "1"].includes(normalized)) return "SI";
  if (["N", "NO", "FALSE", "0"].includes(normalized)) return "NO";

  return String(value);
};

export { cargoInspector, respuestaSiNo };
