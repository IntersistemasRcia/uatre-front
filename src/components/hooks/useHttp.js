import { useCallback, useState } from 'react';
import getStoredToken from '../../store/getSoredToken';

export class UseHttpError {
	constructor(base = {}) {
		this.type = null;
		this.code = null;
		this.message = null;
		Object.assign(this, base);
	}

	#errorQuote(e, o = '"', c = o) {
		return e ? (e === "Error" ? null : o + e + c) : e;
	}

	toString() {
		return [
			["Error", this.#errorQuote(this.type, "(", ")")].join(" "),
			[this.code, this.#errorQuote(this.message)].filter((r) => r).join(": "),
		].join(" ");
	}
}

export const takeOk = (data) => {};
export const takeOkAsync = async (data) => {};
/**
 * @param {UseHttpError} error
 */
export const takeError = (error) => {};
/**
 * @param {UseHttpError} error
 */
export const takeErrorAsync = async (error) => {};
export const takeFinally = () => {};
export const takeFinallyAsync = async () => {};
const def = {
	takeOk,
	takeOkAsync,
	takeError,
	takeErrorAsync,
	takeFinally,
	takeFinallyAsync,
};

const useHttp = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null)
	const sendRequest = useCallback(
			async (
				{
					baseURL = "",
					headers = {},
					method = "GET",
					endpoint = "",
					okType = "json",
					errorType = "json",
					bodyToJSON = true,
					body,
					...configRequest
				},
				takeOk = def.takeOk,
				takeError = def.takeError,
				takeFinally = def.takeFinally,
			) => {
				setIsLoading(true);
				setError(null)

				const url = enviromentURL(baseURL);

				const config = {
					method,
					headers: {
						Authorization: true,
						...headers
					},
					...configRequest,
				};

				if (body != null) {
					if (bodyToJSON) {
						config.headers["Content-Type"] ??= "application/json";
						config.body = JSON.stringify(body);
					} else {
						config.body = body;
					}
				}

				const { token } = getStoredToken();
				if (config.headers.Authorization === true && token)
					config.headers.Authorization = `Bearer ${token}`;
				else if (!("Authorization" in headers) || headers.Authorization === false)
					delete config.headers.Authorization;

				const take = { ok: false, data: null, error: null };
				try {
					const response = await fetch(`${url}${endpoint}`, config);

					const decodeType = async (type = "") => {
						switch (type?.toString().trim().toLowerCase()) {
							case "json":
								{
									const text = await response.text();
									return text.trim() ? JSON.parse(text) : null;
								}
							case "text":
								return response.text();
							case "blob":
								return response.blob();
							case "formdata":
								return response.formData();
							case "arrayBuffer":
								return response.arrayBuffer();
							default:
								return response;
						}
					}

					const data = await decodeType(response.ok ? okType : errorType);
					if (response.ok) {
						take.ok = true;
					} else {
						take.error = {};
						take.error.type = response.statusText;
						take.error.code = response.status;
						take.error.message =
							typeof data === "object" && data != null
								? data.Message ||
								  data.Mensaje ||
								  data.message ||
								  data.mensaje ||
								  data.errors
								: (take.error.message = data);
						take.error.data = data;
						throw Object.assign(new Error(take.error.message), take.error);
					}
					take.data = data;
				} catch (error) {
					take.error = new UseHttpError({ ...take.error, ...error });
					take.error.type ??= error.type ?? "Error";
					take.error.code ??= error.code ?? 0;
					take.error.message ??= error.message ?? "Error";
				} finally {
					if (take.ok) takeOk(take.data);
					else takeError(take.error);
					takeFinally();
					setError(take.error);
					setIsLoading(false);
				}
			},
			[]
		);
	return { isLoading, error, sendRequest };
};

/**
 * Obtiene configuraciones de url de entorno
 * @param {*} baseURL Enviroment name: REACT_APP_< env >_< ... >
 * @returns { {
 * 	protocol: string,
 * 	server: string,
 * 	port?: int,
 * 	path?: string,
 * 	toString: () => string
 * } }
 */
function enviromentURLConfig(baseURL = "") {
	const entries = [];
	const value = (v, d = v) => v ? v : d;
	const toString = (o) => [
		o.protocol
		, [
			[
				o.server
				, o.port
			].filter(e => e).join(":")
			, o.path
		].filter(e => e).join("/")
	].filter(e => e).join("://");
	if (!baseURL) {
		const protocol = value(process.env.REACT_APP_PROTOCOL?.toLowerCase(), "http");
		entries.push(["protocol", protocol]);
		entries.push(["server", value(process.env.REACT_APP_SERVER, "localhost")]);
		entries.push(["port", value(
			protocol === "https"
				? process.env.REACT_APP_PORT_SECURE
				: null
			, process.env.REACT_APP_PORT
		)]);
		entries.push(["path", process.env.REACT_APP_PATH]);
		const r = Object.fromEntries(entries);
		r.toString = () => toString(r);
		return r;
	}
	baseURL = `${baseURL}`.toUpperCase();
	const base = enviromentURLConfig();
	const protocol = process.env[`REACT_APP_${baseURL}_PROTOCOL`]?.toLowerCase() ?? base.protocol;
	entries.push(["protocol", protocol]);
	entries.push(["server", process.env[`REACT_APP_${baseURL}_SERVER`]]);
	entries.push(["port", value(
		protocol === "https"
			? process.env[`REACT_APP_${baseURL}_PORT_SECURE`]
			: null
		, process.env[`REACT_APP_${baseURL}_PORT`]
	)]);
	entries.push(["path", process.env[`REACT_APP_${baseURL}_PATH`]]);
	const r = {
		...base,
		...Object.fromEntries(entries.filter(e => e[1]))
	};
	r.toString = () => toString(r);
	return r;
}

function enviromentURL(baseURL = "") { return enviromentURLConfig(baseURL).toString(); }

export default useHttp;
