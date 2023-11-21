// this interface defines the type of the params object in the callContract function in EOAManagerService
// the params object is a key value pair where the key is a string and the value is a string or an array of strings
export interface callParams {
  types: string[] // Array of parameter types
  // "["0x935ae1f41e01eae7654ce198ac31d338c8897d8acb5682db198e7b591d503b8c",{"redeemed":false}], ["0x935ae1f41e01eae7654ce198ac31d338c8897d8acb5682db198e7b591d503b8c",{"redeemed":false}]"
  values: (string | string[])[] // a 2d array of parameter values
}
