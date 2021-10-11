export const string = {
  slug(str: string): string {
    str = str.replace(/^\s+|\s+$/g, '') // trim
    str = str.toLowerCase()
  
    // remove accents, swap ñ for n, etc
    var from = "àáäâèéëêìíïîòóöôùúüûñç·,:;_/"
    var to = "aaaaeeeeiiiioooouuuunc-----_"
    for (var i = 0, l = from.length; i < l; i++) {
      str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i))
    }
  
    str = str.replace(/[^a-z0-9 - _]/g, '') // remove invalid chars
      .replace(/\s+/g, '-') // collapse whitespace and replace by -
      .replace(/-+/g, '-') // collapse dashes
  
    return str
  },
  safeStringify(obj, indent = 2): string {
    let cache = [];
    const retVal = JSON.stringify(
      obj,
      (key, value) =>
        typeof value === "object" && value !== null
          ? cache.includes(value)
            ? undefined // Duplicate reference found, discard key
            : cache.push(value) && value // Store value in our collection
          : value,
      indent
    );
    cache = null;
    return retVal;
  }
}
