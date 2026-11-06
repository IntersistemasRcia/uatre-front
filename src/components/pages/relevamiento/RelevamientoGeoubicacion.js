import React, { useEffect, useMemo, useRef, useState } from "react";
import { Autocomplete, useLoadScript } from "@react-google-maps/api";
import InputMaterial from "components/ui/Input/InputMaterial";

const libraries = ["places"];

const coordenadasDesdeValor = (valor) => {
  if (!valor || typeof valor !== "string") return null;

  const coincidencia = valor.trim().match(/^\s*(-?\d+(?:[.,]\d+)?)\s*[,;|\s]\s*(-?\d+(?:[.,]\d+)?)\s*$/);
  if (!coincidencia) return null;

  const latitud = Number(coincidencia[1].replace(",", "."));
  const longitud = Number(coincidencia[2].replace(",", "."));
  if (!Number.isFinite(latitud) || !Number.isFinite(longitud) || Math.abs(latitud) > 90 || Math.abs(longitud) > 180) return null;

  return { latitud, longitud };
};

const coordenadasComoValor = ({ lat, lng }) => `${lat},${lng}`;

const RelevamientoGeoubicacion = ({ value, onChange, readOnly, disabled }) => {
  const [direccion, setDireccion] = useState("");
  const [estado, setEstado] = useState("");
  const autocompleteRef = useRef(null);
  const coordenadas = useMemo(() => coordenadasDesdeValor(value), [value]);
  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAP_API_KEY;
  const { isLoaded, loadError } = useLoadScript({
    id: "relevamiento-google-maps",
    googleMapsApiKey,
    libraries,
  });

  useEffect(() => {
    let activo = true;
    setDireccion("");

    if (!value) {
      setEstado("");
      return () => {
        activo = false;
      };
    }

    if (!coordenadas) {
      setEstado("Ubicación no disponible.");
      return () => {
        activo = false;
      };
    }

    if (!googleMapsApiKey) {
      setEstado("Google Maps no está configurado en este entorno.");
      return () => {
        activo = false;
      };
    }

    if (loadError) {
      setEstado("No se pudo cargar Google Maps.");
      return () => {
        activo = false;
      };
    }

    if (!isLoaded || !window.google?.maps) {
      setEstado("Cargando ubicación...");
      return () => {
        activo = false;
      };
    }

    setEstado("Cargando ubicación...");
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat: coordenadas.latitud, lng: coordenadas.longitud } }, (resultados, status) => {
      if (!activo) return;

      if (status === "OK" && resultados?.[0]?.formatted_address) {
        setDireccion(resultados[0].formatted_address);
        setEstado("");
        return;
      }

      setEstado("Ubicación no disponible.");
    });

    return () => {
      activo = false;
    };
  }, [coordenadas, googleMapsApiKey, isLoaded, loadError, value]);

  const seleccionarLugar = () => {
    const lugar = autocompleteRef.current?.getPlace();
    const ubicacion = lugar?.geometry?.location;
    if (!ubicacion) {
      setEstado("Seleccioná una ubicación sugerida por Google Maps.");
      return;
    }

    const latitud = ubicacion.lat();
    const longitud = ubicacion.lng();
    setDireccion(lugar.formatted_address || lugar.name || "");
    setEstado("");
    onChange(coordenadasComoValor({ lat: latitud, lng: longitud }));
  };

  const mostrarCoordenadas = Boolean(value) && (!googleMapsApiKey || loadError || !coordenadas);
  const valorVisible = direccion || (mostrarCoordenadas ? value : readOnly ? (value ? "Ubicación no disponible" : "Sin dato") : "");
  const input = (
    <InputMaterial
      label="Geoubicación"
      value={valorVisible}
      placeholder={readOnly || direccion ? "" : "Buscá y seleccioná una ubicación"}
      helperText={estado || (!readOnly && isLoaded ? "Buscá y seleccioná una ubicación de Google Maps." : "")}
      readOnly={readOnly || !isLoaded || !!loadError || !googleMapsApiKey}
      disabled={disabled}
      onChange={(nuevaDireccion) => {
        setDireccion(nuevaDireccion);
        if (!nuevaDireccion.trim()) onChange("");
      }}
    />
  );

  if (readOnly || !isLoaded || loadError || !googleMapsApiKey) return input;

  return (
    <Autocomplete onLoad={(autocomplete) => { autocompleteRef.current = autocomplete; }} onPlaceChanged={seleccionarLugar}>
      {input}
    </Autocomplete>
  );
};

export default RelevamientoGeoubicacion;
