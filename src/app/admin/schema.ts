import { newCategoryValue } from "@/lib/categories";
import type { SiteContent } from "@/types/content";

/*
 * Describes the editor UI. Each section lists fields by path inside SiteContent
 * ("home.slides"); fields inside lists/groups use paths relative to the item.
 */

type Item = Record<string, unknown>;
type Options = (content: SiteContent) => { value: string; label: string }[];

export type FieldDef =
  | { kind: "text" | "textarea" | "link"; key: string; label: string; hint?: string }
  | { kind: "image"; key: string; label: string; hint?: string; dims?: boolean; dark?: boolean }
  | { kind: "icon"; key: string; label: string }
  | { kind: "toggle"; key: string; label: string; hint?: string; defaultValue?: boolean }
  | { kind: "images"; key: string; label: string; hint?: string; objects?: boolean }
  | { kind: "strings"; key: string; label: string; hint?: string; addLabel: string }
  | { kind: "group"; key: string; label: string; fields: FieldDef[] }
  | {
      kind: "list";
      key: string;
      label: string;
      hint?: string;
      fields: FieldDef[];
      itemTitle: (item: Item, index: number) => string;
      newItem: () => Item;
      addLabel: string;
    }
  | { kind: "checks"; key: string; label: string; hint?: string; options: Options };

export interface SectionDef {
  id: string;
  group: string;
  title: string;
  description?: string;
  /** Shows a project picker; field keys starting with "$project." edit the picked project. */
  perProject?: boolean;
  fields: FieldDef[];
}

const str = (v: unknown, fallback: string) => (typeof v === "string" && v.trim() ? v : fallback);

/** `hideable`: the page lets this button be hidden (see editHide). */
const linkGroup = (key: string, label: string, hideable = false): FieldDef => ({
  kind: "group",
  key,
  label,
  fields: [
    { kind: "text", key: "label", label: "Texto do botão" },
    { kind: "link", key: "href", label: "Link" },
    ...(hideable ? [{ kind: "toggle", key: "hidden", label: "Ocultar botão" } as const] : []),
  ],
});

/** A dropdown/radio option with a chosen icon. */
const iconOptionFields: FieldDef[] = [
  { kind: "icon", key: "icon", label: "Ícone" },
  { kind: "text", key: "label", label: "Texto" },
];

const iconOptionList = (key: string, label: string, addLabel: string): FieldDef => ({
  kind: "list",
  key,
  label,
  fields: iconOptionFields,
  itemTitle: (item, i) => str(item.label, `Opção ${i + 1}`),
  newItem: () => ({ label: "Nova opção", icon: "dots" }),
  addLabel,
});

const linkList = (key: string, label: string): FieldDef => ({
  kind: "list",
  key,
  label,
  fields: [
    { kind: "text", key: "label", label: "Texto" },
    { kind: "link", key: "href", label: "Link", hint: "Ex.: /portfolio, /contato ou https://…" },
  ],
  itemTitle: (item, i) => str(item.label, `Link ${i + 1}`),
  newItem: () => ({ label: "Novo link", href: "/" }),
  addLabel: "Adicionar link",
});

const projectOptions: Options = (c) => c.projects.map((p) => ({ value: p.slug, label: p.title }));
const filterOptions: Options = (c) =>
  c.works.filters.filter((f) => f.value !== "all" && f.label.trim()).map((f) => ({ value: f.value, label: f.label }));

export const sections: SectionDef[] = [
  /* ---------- Geral ---------- */
  {
    id: "identidade",
    group: "Geral",
    title: "Identidade",
    description: "Nome do site (aba do navegador e Google) e logos.",
    fields: [
      { kind: "text", key: "site.title", label: "Nome do site" },
      { kind: "textarea", key: "site.description", label: "Descrição", hint: "Aparece no Google e ao compartilhar o link." },
      { kind: "image", key: "brand.logoHero", label: "Logo grande (branca)", hint: "Topo da home e das páginas de projeto. PNG transparente.", dark: true },
      { kind: "image", key: "brand.logoBar", label: "Logo da barra (preta)", hint: "Barra branca do topo." },
      { kind: "image", key: "brand.logoFooter", label: "Logo do rodapé (branca)", dark: true },
    ],
  },
  {
    id: "menu",
    group: "Geral",
    title: "Menu",
    fields: [linkList("nav.items", "Itens do menu"), linkGroup("nav.contact", "Botão de contato")],
  },

  /* ---------- Home ---------- */
  {
    id: "slides",
    group: "Home",
    title: "Slides do topo",
    description: "Fotos que passam em sequência no topo da home. Arraste a ordem com as setas.",
    fields: [
      { kind: "images", key: "home.slides", label: "Fotos dos slides (desktop)", hint: "Fotos na horizontal, de preferência com 2000px de largura." },
      {
        kind: "images",
        key: "home.slidesMobile",
        label: "Fotos para celular (opcional)",
        hint: "Fotos na vertical (ex.: 1080×1920). Se houver fotos aqui, elas substituem as de cima no celular. Deixe vazio para usar as mesmas do desktop.",
      },
    ],
  },
  {
    id: "citacao",
    group: "Home",
    title: "Citação",
    fields: [
      { kind: "textarea", key: "home.quote", label: "Frase" },
      {
        kind: "text",
        key: "home.quoteHighlight",
        label: "Trecho sublinhado",
        hint: "Palavras da frase que ganham o traço de pincel. Deixe vazio para não ter sublinhado. No modo de edição do site, selecione as palavras e clique em “Sublinhar” ou clique na frase e em “Remover sublinhado”.",
      },
      linkGroup("home.quoteCta", "Botão"),
    ],
  },
  {
    id: "servicos",
    group: "Home",
    title: "Cards de serviços",
    description: "Cards que giram ao passar o mouse.",
    fields: [
      {
        kind: "list",
        key: "home.serviceCards",
        label: "Cards",
        fields: [
          { kind: "image", key: "image", label: "Foto" },
          { kind: "text", key: "title", label: "Título" },
          { kind: "text", key: "price", label: "Preço" },
        ],
        itemTitle: (item, i) => str(item.title, `Card ${i + 1}`),
        newItem: () => ({ title: "Novo serviço", price: "Start at $1,000", image: "/images/services/couples.jpg" }),
        addLabel: "Adicionar card",
      },
      linkGroup("home.serviceCta", "Botão do verso dos cards"),
    ],
  },
  {
    id: "trabalhos-home",
    group: "Home",
    title: "Trabalhos na home",
    fields: [
      { kind: "text", key: "home.worksTitle", label: "Título" },
      { kind: "checks", key: "home.works", label: "Projetos exibidos", hint: "Na ordem em que você marcar.", options: projectOptions },
      linkGroup("home.worksCta", "Botão"),
    ],
  },
  {
    id: "depoimentos",
    group: "Home",
    title: "Depoimentos",
    fields: [
      {
        kind: "list",
        key: "home.testimonials",
        label: "Depoimentos",
        fields: [
          { kind: "textarea", key: "quote", label: "Depoimento" },
          { kind: "image", key: "avatar", label: "Foto" },
          { kind: "text", key: "name", label: "Nome" },
          { kind: "text", key: "company", label: "Empresa (opcional)" },
          { kind: "link", key: "companyHref", label: "Link da empresa (opcional)" },
        ],
        itemTitle: (item, i) => str(item.name, `Depoimento ${i + 1}`),
        newItem: () => ({ quote: "", name: "Nome", company: "", companyHref: "", avatar: "/images/testimonials/mercel.jpg" }),
        addLabel: "Adicionar depoimento",
      },
    ],
  },
  {
    id: "o-que-fazemos",
    group: "Home",
    title: "What we do",
    fields: [
      { kind: "text", key: "home.whatWeDoTitle", label: "Título" },
      {
        kind: "list",
        key: "home.serviceRows",
        label: "Linhas",
        fields: [
          { kind: "text", key: "number", label: "Número" },
          { kind: "text", key: "title", label: "Título" },
          { kind: "strings", key: "items", label: "Itens", addLabel: "Adicionar item" },
        ],
        itemTitle: (item, i) => `${str(item.number, String(i + 1).padStart(2, "0"))} · ${str(item.title, "Sem título")}`,
        newItem: () => ({ number: "04", title: "Novo", items: ["Item"] }),
        addLabel: "Adicionar linha",
      },
      linkGroup("home.whatWeDoCta", "Botão"),
    ],
  },
  {
    id: "agendamento",
    group: "Home",
    title: "Formulário de agendamento",
    description: "Escolha o texto e o ícone de cada opção dos menus.",
    fields: [
      { kind: "text", key: "appointment.title", label: "Título" },
      { kind: "textarea", key: "appointment.subtitle", label: "Texto abaixo do título", hint: "Deixe vazio para esconder." },
      { kind: "image", key: "appointment.image", label: "Foto ao lado" },
      { kind: "text", key: "appointment.serviceLabel", label: "Rótulo: serviço" },
      { kind: "group", key: "appointment.servicePlaceholder", label: "Primeira opção (vazia)", fields: iconOptionFields },
      iconOptionList("appointment.services", "Opções de serviço", "Adicionar serviço"),
      { kind: "text", key: "appointment.locationLabel", label: "Rótulo: local" },
      { kind: "group", key: "appointment.locationAny", label: "Opção “qualquer local”", fields: iconOptionFields },
      iconOptionList("appointment.locations", "Opções de local", "Adicionar local"),
      { kind: "text", key: "appointment.employeeLabel", label: "Rótulo: profissional" },
      { kind: "group", key: "appointment.employeeAny", label: "Opção “qualquer profissional”", fields: iconOptionFields },
      iconOptionList("appointment.employees", "Opções de profissional", "Adicionar profissional"),
      { kind: "text", key: "appointment.submitLabel", label: "Texto do botão" },
      { kind: "text", key: "appointment.detailsNameLabel", label: "Passo 2 · rótulo: nome" },
      { kind: "text", key: "appointment.detailsEmailLabel", label: "Passo 2 · rótulo: e-mail" },
      { kind: "text", key: "appointment.detailsPhoneLabel", label: "Passo 2 · rótulo: telefone" },
      { kind: "text", key: "appointment.detailsMessageLabel", label: "Passo 2 · rótulo: mensagem" },
      { kind: "text", key: "appointment.backLabel", label: "Passo 2 · botão voltar" },
      { kind: "text", key: "appointment.sendLabel", label: "Passo 2 · botão enviar" },
      { kind: "text", key: "appointment.sendingMessage", label: "Mensagem enquanto envia" },
      { kind: "textarea", key: "appointment.successMessage", label: "Mensagem de obrigado (depois de enviar)" },
      { kind: "text", key: "appointment.newReservationLabel", label: "Botão “novo agendamento”" },
    ],
  },

  /* ---------- Trabalhos ---------- */
  {
    id: "our-works",
    group: "Trabalhos",
    title: "Página Our Works",
    fields: [
      { kind: "text", key: "pages.works", label: "Endereço da página", hint: "Ex.: portfolio. Ao mudar, o menu, o rodapé e os botões passam a apontar para o novo endereço, e o antigo redireciona para ele." },
      { kind: "text", key: "works.title", label: "Título" },
    ],
  },
  {
    id: "categorias",
    group: "Trabalhos",
    title: "Categorias",
    description: "Aparecem como filtros na página Our Works e para marcar em cada projeto.",
    fields: [
      { kind: "text", key: "works.allLabel", label: "Filtro que mostra tudo", hint: "Ex.: Todos. Sempre aparece primeiro." },
      {
        kind: "list",
        key: "works.filters",
        label: "Categorias",
        hint: "Ao renomear, os projetos com esse nome no card acompanham. Ao apagar, ela sai de todos os projetos.",
        fields: [{ kind: "text", key: "label", label: "Nome" }],
        itemTitle: (item, i) => str(item.label, `Categoria ${i + 1}`),
        newItem: () => ({ label: "Nova categoria", value: newCategoryValue() }),
        addLabel: "Adicionar categoria",
      },
    ],
  },
  {
    id: "projetos",
    group: "Trabalhos",
    title: "Projetos",
    description: "Cada projeto tem uma página própria dentro do endereço da página Our Works (ex.: /portfolio/casamento-ana-e-pedro).",
    fields: [
      {
        kind: "list",
        key: "projects",
        label: "Projetos",
        fields: [
          { kind: "text", key: "title", label: "Título" },
          { kind: "text", key: "category", label: "Categoria no card", hint: "Texto embaixo do título no card. Use o nome de uma das categorias para ele acompanhar quando ela for renomeada." },
          {
            kind: "toggle",
            key: "autoSlug",
            label: "Endereço automático",
            hint: "Ligado: o endereço da página segue o título ao salvar (ex.: “Método ROCHA” → metodo-rocha). O endereço antigo continua funcionando.",
            defaultValue: true,
          },
          { kind: "text", key: "slug", label: "Endereço da página", hint: "Usado quando o endereço automático está desligado. Ex.: casamento-ana-e-pedro." },
          { kind: "image", key: "image", label: "Foto do card" },
          { kind: "image", key: "hero", label: "Foto de capa da página" },
          { kind: "images", key: "gallery", label: "Galeria de fotos", objects: true, hint: "Fotos da página deste projeto. Passe o mouse sobre uma foto para trocar, mudar de posição ou apagar." },
          { kind: "checks", key: "tags", label: "Categorias", hint: "Em quais filtros da página Our Works este projeto aparece. Edite a lista em Trabalhos → Categorias.", options: filterOptions },
          { kind: "checks", key: "related", label: "Outros trabalhos (no fim da página)", options: projectOptions },
        ],
        itemTitle: (item, i) => str(item.title, `Projeto ${i + 1}`),
        newItem: () => ({
          title: "Novo projeto",
          slug: "",
          autoSlug: true,
          category: "",
          image: "/images/portfolio/portfolio-1.jpg",
          hero: "/images/projects/roaming.jpg",
          tags: [],
          related: [],
          gallery: [],
          intro: "",
          meta: [
            { label: "Cliente", value: "" },
            { label: "Local", value: "" },
            { label: "Data", value: "" },
          ],
        }),
        addLabel: "Adicionar projeto",
      },
    ],
  },
  {
    id: "pagina-projeto",
    group: "Trabalhos",
    title: "Página de projeto",
    description: "Escolha o projeto e edite o texto, as informações e as fotos da página dele.",
    perProject: true,
    fields: [
      { kind: "textarea", key: "$project.intro", label: "Texto de introdução" },
      {
        kind: "list",
        key: "$project.meta",
        label: "Informações (Client / Where / When)",
        fields: [
          { kind: "text", key: "label", label: "Rótulo" },
          { kind: "text", key: "value", label: "Valor" },
        ],
        itemTitle: (item, i) => str(item.label, `Info ${i + 1}`),
        newItem: () => ({ label: "Rótulo", value: "Valor" }),
        addLabel: "Adicionar informação",
      },
      { kind: "images", key: "$project.gallery", label: "Galeria de fotos", objects: true },
      { kind: "text", key: "projectPage.otherTitle", label: "Título “Other works” (igual em todos os projetos)" },
    ],
  },

  /* ---------- About ---------- */
  {
    id: "about",
    group: "Páginas",
    title: "About",
    fields: [
      { kind: "text", key: "pages.about", label: "Endereço da página", hint: "Ex.: sobre. Ao mudar, o menu, o rodapé e os botões passam a apontar para o novo endereço, e o antigo redireciona para ele." },
      { kind: "image", key: "about.heroImage", label: "Foto de capa" },
      { kind: "text", key: "about.heroTitle", label: "Título da capa" },
      { kind: "textarea", key: "about.intro", label: "Texto de introdução" },
      {
        kind: "list",
        key: "about.features",
        label: "Blocos de texto e foto",
        fields: [
          { kind: "text", key: "title", label: "Título" },
          { kind: "textarea", key: "text", label: "Texto" },
          { kind: "image", key: "image", label: "Foto", dims: true },
          linkGroup("cta", "Botão (opcional — deixe o texto vazio para não mostrar)"),
        ],
        itemTitle: (item, i) => str(item.title, `Bloco ${i + 1}`),
        newItem: () => ({ title: "Novo bloco", text: "", image: "/images/about/loyal-customers.jpg", width: 682, height: 1024 }),
        addLabel: "Adicionar bloco",
      },
      { kind: "toggle", key: "about.teamHidden", label: "Ocultar seção da equipe" },
      { kind: "text", key: "about.teamTitle", label: "Título da equipe" },
      {
        kind: "list",
        key: "about.team",
        label: "Equipe",
        fields: [
          { kind: "image", key: "image", label: "Foto (quadrada)" },
          { kind: "text", key: "name", label: "Nome" },
          { kind: "text", key: "role", label: "Cargo" },
        ],
        itemTitle: (item, i) => str(item.name, `Pessoa ${i + 1}`),
        newItem: () => ({ name: "Nome", role: "Cargo", image: "/images/about/team-0.jpg" }),
        addLabel: "Adicionar pessoa",
      },
    ],
  },
  {
    id: "contato",
    group: "Páginas",
    title: "Contato",
    description: "Textos do formulário e o ícone de cada opção.",
    fields: [
      { kind: "text", key: "pages.contact", label: "Endereço da página", hint: "Ex.: contato. Ao mudar, o menu, o rodapé e os botões passam a apontar para o novo endereço, e o antigo redireciona para ele." },
      { kind: "text", key: "contact.formTitle", label: "Título" },
      { kind: "text", key: "contact.nameLabel", label: "Rótulo: nome" },
      { kind: "text", key: "contact.emailLabel", label: "Rótulo: e-mail" },
      { kind: "text", key: "contact.sessionLabel", label: "Pergunta: tipo de sessão" },
      iconOptionList("contact.sessionTypes", "Tipos de sessão", "Adicionar tipo"),
      { kind: "text", key: "contact.referralLabel", label: "Pergunta: como conheceu" },
      iconOptionList("contact.referrals", "Opções de “como conheceu”", "Adicionar opção"),
      { kind: "text", key: "contact.messageLabel", label: "Rótulo: mensagem" },
      { kind: "text", key: "contact.submitLabel", label: "Texto do botão" },
      { kind: "text", key: "contact.addressTitle", label: "Título do endereço" },
      linkGroup("contact.directions", "Botão de rota (Google Maps)", true),
      { kind: "image", key: "contact.image", label: "Foto ao lado do endereço" },
    ],
  },

  /* ---------- Rodapé ---------- */
  {
    id: "rodape",
    group: "Geral",
    title: "Rodapé e contatos",
    description: "O endereço, telefone e e-mail também aparecem na página de contato.",
    fields: [
      { kind: "text", key: "footer.contactTitle", label: "Título da coluna de contato" },
      { kind: "textarea", key: "footer.address", label: "Endereço", hint: "Uma linha por parte do endereço." },
      { kind: "text", key: "footer.phone", label: "Telefone" },
      { kind: "text", key: "footer.email", label: "E-mail", hint: "Recebe as mensagens do formulário de contato." },
      { kind: "text", key: "footer.menuTitle", label: "Título da coluna do menu" },
      linkList("footer.links", "Links do rodapé"),
      { kind: "text", key: "footer.followTitle", label: "Título das redes sociais" },
      {
        kind: "list",
        key: "footer.socials",
        label: "Redes sociais",
        fields: [
          { kind: "icon", key: "icon", label: "Ícone" },
          { kind: "text", key: "label", label: "Nome" },
          { kind: "link", key: "href", label: "Link do perfil" },
        ],
        itemTitle: (item, i) => str(item.label, `Rede ${i + 1}`),
        newItem: () => ({ label: "Instagram", href: "https://instagram.com/", icon: "instagram" }),
        addLabel: "Adicionar rede",
      },
    ],
  },
];

export const sectionGroups = ["Geral", "Home", "Trabalhos", "Páginas"];
