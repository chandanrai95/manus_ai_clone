type HttpVerb = "GET"|"PUT"|"POST"|"DELETE"


export function makeHttpReq<T>(verb: HttpVerb, endpoint: string, input?:T) {
  return new Promise(async (resolve, reject) => {
    try {

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/${endpoint}`, {
        method: verb,
        headers: {
          "accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      })

      if (!response.ok) throw new Error(response.statusText)

      const data = await response.json()
      resolve(data)
    } catch (error) {
      console.log(`makeHttpReq ${verb}/${endpoint} error`, error)
      reject(error)
    } 
  })
}
