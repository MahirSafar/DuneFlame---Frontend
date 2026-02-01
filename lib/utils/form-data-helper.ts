export const toPascalFormData = (data: any): FormData => {
  const formData = new FormData();

  const buildFormData = (obj: any, prefix: string = ""): void => {
    if (obj instanceof File) {
      formData.append(prefix, obj);
    } else if (Array.isArray(obj)) {
      obj.forEach((item: any, index: number) => {
        buildFormData(item, `${prefix}[${index}]`);
      });
    } else if (typeof obj === "object" && obj !== null) {
      Object.keys(obj).forEach((key: string) => {
        const value = obj[key];
        // Key-in ilk hərfini böyük edirik (PascalCase)
        const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
        const fullKey = prefix ? `${prefix}.${pascalKey}` : pascalKey;
        buildFormData(value, fullKey);
      });
    } else {
      formData.append(prefix, obj === null ? "" : obj);
    }
  };

  buildFormData(data);
  return formData;
};