package templates

import (
	"bytes"
	"fmt"
	"html/template"
	"os"
	"strings"

	"github.com/inconshreveable/log15"
)

func Render(fullPath string, destDir string, temp interface{}) {
	name := fullPath[strings.LastIndex(fullPath, "/")+1:]
	dest := fmt.Sprintf("%s/%s", destDir, strings.ReplaceAll(name, "_tmpl", ""))

	if !strings.Contains(name, "_tmpl") {
		log15.Crit("template name must contain _tmpl", "name", name)
		panic("template name must contain _tmpl")
	}

	t := template.Must(template.New(name).ParseFiles(fullPath))
	var tpl bytes.Buffer
	err := t.Execute(&tpl, temp)
	if err != nil {
		panic(err)
	}
	result := tpl.String()

	f, err := os.OpenFile(dest, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0700)
	if err != nil {
		panic(err)
	}
	defer f.Close()

	fmt.Fprint(f, result)
}
