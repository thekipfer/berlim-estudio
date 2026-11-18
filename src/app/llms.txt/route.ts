import { getContent } from "@/lib/content-store";
import { AREA_SERVED, SERVICES, SITE_NAME, absoluteUrl, business, pageSeo, projectFacts } from "@/lib/seo";
import { pageHref, projectHref } from "@/lib/site";

/*
 * /llms.txt: a plain summary of the studio for AI assistants and answer engines (llmstxt.org).
 * It helps them describe the business correctly; it is not a ranking factor.
 * Built from the site content, so it never says more than the site does.
 */

export const revalidate = 3600;

export async function GET() {
  const content = await getContent();
  const b = business(content);
  const home = pageSeo(content, "home");
  const where = [b.city, b.region].filter(Boolean).join(", ");

  const projects = content.projects.map((p) => {
    const f = projectFacts(p);
    const facts = [f.client && `cliente: ${f.client}`, f.place && `local: ${f.place}`, f.date && `data: ${f.date}`].filter(Boolean).join("; ");
    return `- [${p.title}](${absoluteUrl(projectHref(content, p.slug))}): ${f.coverage}${facts ? ` (${facts})` : ""}`;
  });

  const text = `# ${SITE_NAME}

> ${home.description}

${content.home.quote.trim()}

## Empresa

- Nome: ${SITE_NAME}
- Atividade: fotografia e produção audiovisual para empresas e eventos
- Endereço: ${b.street}${where ? `, ${where}` : ""}, Brasil
- Telefone: ${b.phone}
- E-mail: ${b.email}
- Site: ${absoluteUrl("/")}
${b.socials.map((s) => `- Rede social: ${s}`).join("\n")}

## Serviços

${SERVICES.map((s) => `- ${s}`).join("\n")}

## Onde atende

Sede em ${where || "Santa Catarina"}. Atende principalmente ${AREA_SERVED.join(", ")} e todo o estado de Santa Catarina, além de outras regiões sob consulta.

## Páginas

- [Início](${absoluteUrl("/")}): apresentação e serviços
- [Portfólio](${absoluteUrl(pageHref(content, "works"))}): trabalhos realizados
- [Sobre](${absoluteUrl(pageHref(content, "about"))}): ${content.about.intro.trim()}
- [Contato e orçamento](${absoluteUrl(pageHref(content, "contact"))}): formulário, telefone e endereço

## Trabalhos no portfólio

${projects.join("\n")}
`;

  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
