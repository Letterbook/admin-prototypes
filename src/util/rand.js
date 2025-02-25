export const normal = (mean=0, stddev=1) => {
	let u = 1-Math.random()
	let v = Math.random()
	let z = Math.sqrt(-1 * Math.log(u)) * Math.cos(2*Math.PI*v)
	return z * stddev + mean
}

export default {
	normal
}