/* eslint-disable */
// @ts-nocheck
/* ============================================================
 * Contact Factoring — Digital Factoring Portal (v0.3)
 * Self-contained UI/interaction engine, ported from the approved
 * v0.3 HTML prototype. Mounted by src/components/FactoringPortal.tsx
 * via initFactoringPortal(). The typed integration contract lives in
 * src/lib/api (FactoringApi) for wiring real back-end services.
 * ============================================================ */
/* ============================================================
   CONTACT FACTORING — Digital Factoring Portal (prototype)
   Single-file SPA · no backend · in-memory mock data.
   API-ready: actions funnel through mutating helpers that a
   real backend would replace with fetch() calls.
   ============================================================ */
const LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOAAAADgCAMAAAAt85rTAAAA51BMVEUoKID////zgSAZJIAgJYH1gh5kP3D5hBgmJn/8uDPgeC4jI34aGnsAAHcQEHmIiLX/3iEYIIG4uND/vC7oqj5mUHIeHnwWFnpQT5YAAHjHx9vqzC+9vdQ3NokLC3gAAHKqqsjt7fT19fn/4xmSkrnf3+rR0eKcnL9eXp2EhLFJSZF8fKzb2+hiYp2xsc5nW3BsbKGZmb49PItxcKVCQo0xMYRXVphkY5t3dqeSgF/nujXiljiLUV4HEITLsUD8xC33lidNNnRMRXe2ZEl+cGT71SX4qzB0R2i9pEv8oiZZUHNmVXFdPHEPfAppAAAIuklEQVR4nO2a+ZObOhLHYeO3UZ6EHJNdCfthMA74wMdibGPv+fZ6e///f8/qxMierVpPhkpVqj8/ZAYQkr5St7qbjOcBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPBq0I2vPZW3BxFKGbYavW9NIU7ROi4y33IgX3tGbwpKmonvsGLPdfBKw0YIS/o2F8ZiV54/Hz03ppjnAA8G3rMS8VTTr0LezO/0+Yv0qR7Q2Lz3pOuynRkueeq1J+GXe3nCBflTXeDSTDR4cuiDfm/53HDPwaJHfX6kXRAxwiklN39E4lJAxBNOE0qwmWhuJppy9dRj4odqyjlhd7uKme6EYi9Z6PeaQF4/5/b/L4h27LMIl4qDcnsWDKp8Fu7zHeV6kqiezcIwjPMUVYdwss+bQElMzRE1mUkOhG3iMJxp8spL8E0dHZfXwz6UvVSMmLH19aYXhUnYytufUrHiCqEHJ7v2ZJ3nXM2RbIwpTuyqLM5YbnTW3f6YBgvHHiYnYhYoqZe3pjviGk8vAvFtjF2AOw+I5wSOAsmHNPTvKajTiZoo4fen1kWFVea+T60LGk745Tl+EYGVMS8dR+eruzlmichukuJBoDyPSO7cqcnuoVUtJk93Tp+LNHU2Ohv3oA+fbPdH2r1PVo9CqIcGj/r8beIlzmZnnOcPrcQ5STf3K8McwSH9X7P8AvjS9B47BzyuH4VkBJHN422hBwXORCdJsn1oNUn4/bY2pHGu1z1khzebm3btHwV2hsVhdbFZzorRvZ3uJmpPoIzbQLNtVoJdjXGkaS4H238ctGuWzSr1FLXBpVTXby9PKPHa8bu3+dDcno05Y6nZ5Q1JMv3bMCDitlmEgtrmy4RJsKcTTIwZac/ToY0kwtRF0aISUGvZK9JbQtranJtb29A4S+Wg1vMO1DhsFsjbdjuFRU4eO0GMJsF4NBrPjD1ap94ErRBj2XPSXyZKzfCZMwZZ271B3YkMk6vZbnUaJMZ0h5zqjZ3fElGWnI/7Rea3zMeLB1Np87vn8t6nsOd07CS7Y2N8lZZtd/ASmCimT4PAzD9iU/3L1s4dBavJXZBZJOaX+ubrxFp2f4koMmvv590xcGuJ+ppV+vqUmtalnKQ9aOeB3XA7UXa+qy3lMyNm0vF1a9lNPzmoEuiZhXZc0E54ZuKSseMsmVpJqpVxX+GCZmN3uhNWPhRfQoQRM+yEAq7Xa97j9582zNfdIEGNc1WmojC2GAatJNVqbzffnq3azFEbvYv9+ng0F7ZN2Um7jQlse6wFsY20ThYYFI5qu1WVdUG9CzaCRsysknFBa3jZLqWE2wh5NgN1PhTcW3avAo/dJCI1lmiOGGIsKaFFZxcQMzoIMWertug2757KLm02PbN3O6e1Tbwv/bngzUQnKcMtaXdbUWAMdknNLmSqgLUnzySxtqotmpvAEyrDs9H9atO0jrPbU3jc4/cYZPxczPNS1uWpPJ3KMkqN34QpxpwbfXPGrQuqsGUj6JBYi95RuTo2c1HnMhubrgZW4GLM9Sre0t1ArW1PCl+o70TctUVM3ERtebrmt1NFvnlzVG5aFJVYnMiWvos0EbW7aVSkbSK6XTcqY/XIsV1bed2Twlu1dCMPHosdP06REwXRVO9NFjC3sPLsihRh2NYU+/sSX7iuW+xmfZRKEmtpHSLmPQSybYDatVD5KTNf4uIEOzVPlr5gE8I975ZBvOcKjPsS6NH7rCNjnj0XWyYEe8zc1J8weeuCiDotgxdsYj5FXuKuZE6YUx72UQtqULB0RlZh3K2950NZAFh31V9MbcEo7NXGMyP4oa4V1jqW4zg7Jk7opLvXZV+njMxH61nmrK24yet9m4/knpZkGqmEDI2MdvkZhVa3LzUir+Sl9betkaAjJD3FN9OXJzEdtuPO+4wV6lPlcZ3n+VBSI32PNtf1enM5B+aTKBtq9KrU+kLHPhaU12EuO1jLigmn0+N6uKmmaaNbme3BCW90u/wqVxHxJLrqFsceg70emxHOOZG0toLlVeerNNGYD5z6wj5W7xPePmXqGcLE7VLeUJ9dmb1mpp+e9QGAhgeS5OHAuL/B0/4OzT7hy0KyvROEkruvSnyZ9RgWnKFf5rXd2Wz1jBBjCKv/lRE/6yKUn/0xw/Jf8VME0atMHZiuuximPckdiWNPHZ0jl3evASmBe6+ua8SnlxVuSkzOu8sZ7fxtfca8qSKKztG5rM7Rhp0a0lQ18RjeVadJPxvKf/2D4Te/cPjt96/gd++kwFkaBJTLrK4QBYXK7lSis0aFypIufib/882P9r5MB450p4J9P1X97//w+aPi848funz643fP8/5PAykw226L2BPJSz73J1NRRyxnJ3F3KbKbxbDwZyLnjveVEChS0zwWddRcNY362EHEf/ho+OQI/PCz5/nu+wGyPrioRHUVHP147e9Tylkt9nLqZ0lS+kXjb1MaKIGHNBU5qKifRdN9H8XE4M9W38cPXyzw/V9GygdnwtZGGyEs2flx7i9TQlkpBNaicuRnP2tkNZIogRuiBC7S4Kpee3NGfzUW+vEnV9/fXiPw7wMtkCJVOR42wkRL4Vx5SMTuXc+Fv98t/HB1E7gmgUi6M38R+/O6DxOl//hs+OmTwz/fv4J3nhHomb+5yITxqRrwmorzZRnJSiI7X6zAvREYycNncf+HGG/C4F+/Mvz7lw4/fwX/ERvo4ajS5z2NhuvBpcFJNBxGBKH1sOHeOr9yNq0a7OGmEsHihFhVkTQ9NXE/JoqwjXts0GU0eA2qS8yMqYmqAcnfsSolkPwXqfpC3RXtRLgXm8aI9MF00+MXi69NMpdR0b9+s/USi7bCNdff7AbKTwcY8W/rb1Pv+Sb/fBoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeua/K5jpFdPwW8IAAAAASUVORK5CYII=";

/* ---------------- STAGE MODEL ---------------- */
const STAGE = {
  draft:        {label:'Draft',                    short:'Draft',            cls:'draft'},
  submitted:    {label:'Submitted',                short:'Submitted',        cls:'submitted'},
  pendingbuyer: {label:'Pending Buyer Validation', short:'Buyer Validation', cls:'pendingbuyer'},
  fra:          {label:'FRA Validation',           short:'FRA Validation',   cls:'fra'},
  deviation:     {label:'Deviation Committee',       short:'Deviation Cttee',   cls:'deviation'},
  credit:       {label:'Execution Validation',     short:'Execution Val.',   cls:'credit'},
  approved:     {label:'Approved',                 short:'Approved',         cls:'approved'},
  funded:       {label:'Funded',                   short:'Funded',           cls:'funded'},
  settled:      {label:'Settled',                  short:'Settled',          cls:'settled'},
  closed:       {label:'Closed',                   short:'Closed',           cls:'closed'},
  rejected:     {label:'Rejected',                 short:'Rejected',         cls:'rejected'},
};
function chainFor(c){
  const ch=['draft','submitted'];
  if(c.type==='reverse' && c.initiator==='supplier') ch.push('pendingbuyer');
  ch.push('fra');
  if(c.flagConc) ch.push('deviation');
  ch.push('credit','approved','funded','settled','closed');
  return ch;
}
function nextStage(c){ const ch=chainFor(c); const i=ch.indexOf(c.stage); return i>=0&&i<ch.length-1?ch[i+1]:null; }

/* ---------------- ROLES (with profile-module fields) ---------------- */
const ROLES = {
  rm:       {name:'Relationship Manager', short:'RM',      icon:'🧭', color:'#34349A', bg:'#E7E7F6', login:'ops',    internal:true,  user:'Walaa Yusuf',   company:'Contact Financial Holding', email:'walaa.yusuf@contact.eg',  mobile:'+20 100 552 7180', last:'Today · 08:40'},
  buyer:    {name:'Buyer',                short:'Buyer',   icon:'🏢', color:'#1B4DA1', bg:'#E4ECF8', login:'client', internal:false, user:'Carrefour Egypt',  company:'Carrefour Egypt',           email:'finance@carrefour.eg',     mobile:'+20 100 118 2420', last:'Today · 08:05'},
  supplier: {name:'Supplier',             short:'Supplier',icon:'📦', color:'#15803D', bg:'#E6F3EB', login:'client', internal:false, user:'BIM Stores',       company:'BIM Egypt',                 email:'ar@bim.eg',                mobile:'+20 100 771 2040', last:'Today · 06:48'},
  credit:   {name:'Credit Officer',          short:'Credit',  icon:'📊', color:'#0E7490', bg:'#E1F2F6', login:'ops',    internal:true,  user:'Pierre',    company:'Contact Financial Holding', email:'pierre@contact.eg',   mobile:'+20 122 304 8810', last:'Today · 07:55'},
  legal:    {name:'Legal Officer',           short:'Legal',   icon:'⚖️', color:'#92400E', bg:'#FBEEDD', login:'ops',    internal:true,  user:'Doaa Orfy',      company:'Contact Financial Holding', email:'doaa.orfy@contact.eg',     mobile:'+20 109 220 7741', last:'Today · 08:12'},
  fra:      {name:'FRA Validation Team',  short:'FRA',     icon:'🛡️', color:'#4F46E5', bg:'#ECEBFB', login:'ops',    internal:true,  user:'Nadia Saleh',    company:'Contact Financial Holding', email:'nadia.saleh@contact.eg',   mobile:'+20 111 778 9921', last:'Yesterday · 16:20'},
  deviation: {name:'Deviation Committee',   short:'Committee',icon:'⚖️',color:'#7C3AED', bg:'#F1E9FD', login:'ops',    internal:true,  user:'Hany Greiss',    company:'Contact Financial Holding', email:'committee@contact.eg',     mobile:'+20 100 600 3340', last:'Yesterday · 14:02'},
  finance:  {name:'Finance Viewer',         short:'Finance', icon:'🏦', color:'#9333EA', bg:'#F4E8FC', login:'ops',    internal:true,  user:'Emad Ashour',    company:'Contact Financial Holding', email:'emad.ashour@contact.eg',   mobile:'+20 100 990 1120', last:'Today · 09:10'},
  admin:    {name:'Administrator',        short:'Admin',   icon:'⚙️', color:'#5A6B72', bg:'#EDF1F2', login:'ops',    internal:true,  user:'System Admin',   company:'Contact Financial Holding', email:'admin@contact.eg',         mobile:'+20 100 000 0001', last:'Today · 09:25'},
};

/* ---------------- I18N (chrome only) ---------------- */
const I18N = {
  en:{ sys:'Digital Factoring Portal', search:'Search invoices, parties, refs…', viewing_as:'View as',
    notifications:'Notifications', greeting:'Welcome back', home:'Home',
    sec_overview:'Overview', sec_clients:'Clients & Profiles', sec_factoring:'Factoring',
    sec_workflow:'Workflow & Approvals', sec_finance:'Finance', sec_admin:'Administration', sec_my:'My Portal' },
  ar:{ sys:'بوابة التخصيم الرقمي', search:'ابحث في الفواتير والأطراف…', viewing_as:'العرض بصفة',
    notifications:'الإشعارات', greeting:'مرحبًا بعودتك', home:'الرئيسية',
    sec_overview:'نظرة عامة', sec_clients:'العملاء والملفات', sec_factoring:'التخصيم',
    sec_workflow:'سير العمل والاعتمادات', sec_finance:'المالية', sec_admin:'الإدارة', sec_my:'بوابتي' },
};
function t(k){ return (I18N[state.lang]&&I18N[state.lang][k]) || I18N.en[k] || k; }

/* ---------------- NAVIGATION (role-based) ---------------- */
const NAV = {
  rm:[
    {sec:'sec_overview', items:[{v:'dashboard',i:'◎',l:'Dashboard'}]},
    {sec:'sec_clients', items:[
      {v:'buyers',i:'🏢',l:'Buyer Management'},
      {v:'suppliers',i:'📦',l:'Supplier Management'},
      {v:'supplier-linking',i:'🔗',l:'Supplier Linking'},
      {v:'profile-approvals',i:'📝',l:'Profile Approvals', badge:()=>PROFILE_APPROVALS.filter(p=>paOverall(p).l==='Returned to RM').length},
      {v:'limits',i:'📐',l:'Limit Management'},
    ]},
    {sec:'sec_factoring', items:[
      {v:'factoring',i:'⇄',l:'Factoring Overview'},
      {v:'invoices',i:'🧾',l:'Invoice Management'},
    ]},
    {sec:'sec_workflow', items:[
      {v:'fra-queue',i:'🛡️',l:'FRA Validation', badge:()=>countStage('fra')},
      {v:'approvals',i:'✓',l:'Approvals', badge:()=>cases.filter(c=>['submitted','pendingbuyer'].includes(c.stage)).length},
    ]},
    {sec:'sec_finance', items:[{v:'settlements',i:'💳',l:'Settlement Tracking'}]},
    {sec:'sec_admin', items:[
      {v:'reports',i:'📈',l:'Reports'},
      {v:'audit',i:'🗂️',l:'Audit Logs'},
    ]},
  ],
  buyer:[
    {sec:'sec_my', items:[
      {v:'dashboard',i:'◎',l:'Dashboard'},
      {v:'pending-validation',i:'⏳',l:'Pending Validation', badge:()=>pendingForBuyer().length},
      {v:'invoices',i:'🧾',l:'Invoices'},
      {v:'invoice-new',i:'＋',l:'Upload Invoice'},
      {v:'limits',i:'📐',l:'My Limits'},
      {v:'financing',i:'📈',l:'Financing Requests'},
      {v:'settlements',i:'💳',l:'Settlements'},
      {v:'documents',i:'📁',l:'Documents'},
    ]},
  ],
  supplier:[
    {sec:'sec_my', items:[
      {v:'dashboard',i:'◎',l:'Dashboard'},
      {v:'invoice-new',i:'＋',l:'Upload Invoice'},
      {v:'invoices',i:'🧾',l:'My Invoices'},
      {v:'financing',i:'📈',l:'Financing Status'},
      {v:'escrow-ack',i:'🔐',l:'Escrow Acknowledgements', badge:()=>escrowPending().length},
      {v:'settlements',i:'💳',l:'Settlements & Payments'},
      {v:'documents',i:'📁',l:'Documents'},
    ]},
  ],
  credit:[
    {sec:'sec_overview', items:[{v:'dashboard',i:'◎',l:'Credit Dashboard'}]},
    {sec:'sec_clients', items:[
      {v:'profile-approvals',i:'📝',l:'Profile Approvals', badge:()=>countProfile('credit')},
    ]},
    {sec:'sec_workflow', items:[
      {v:'credit-queue',i:'📊',l:'Execution Validation', badge:()=>countStage('credit')},
      {v:'limits',i:'📐',l:'Limits & Concentration'},
    ]},
    {sec:'sec_admin', items:[{v:'audit',i:'🗂️',l:'Audit Logs'}]},
  ],
  legal:[
    {sec:'sec_overview', items:[{v:'dashboard',i:'◎',l:'Legal Dashboard'}]},
    {sec:'sec_clients', items:[
      {v:'profile-approvals',i:'⚖️',l:'Profile Approvals', badge:()=>countProfile('legal')},
    ]},
    {sec:'sec_admin', items:[{v:'documents',i:'📁',l:'Legal Documents'},{v:'audit',i:'🗂️',l:'Audit Logs'}]},
  ],
  fra:[
    {sec:'sec_overview', items:[{v:'dashboard',i:'◎',l:'FRA Dashboard'}]},
    {sec:'sec_workflow', items:[{v:'fra-queue',i:'🛡️',l:'FRA Validation Queue', badge:()=>countStage('fra')}]},
    {sec:'sec_admin', items:[{v:'audit',i:'🗂️',l:'Validation Audit'}]},
  ],
  deviation:[
    {sec:'sec_overview', items:[{v:'dashboard',i:'◎',l:'Committee Dashboard'}]},
    {sec:'sec_workflow', items:[
      {v:'deviation-queue',i:'⚖️',l:'Limit Deviations', badge:()=>countStage('deviation')},
      {v:'limits',i:'📐',l:'Limit Allocation'},
    ]},
    {sec:'sec_admin', items:[{v:'audit',i:'🗂️',l:'Committee Audit'}]},
  ],
  finance:[
    {sec:'sec_overview', items:[{v:'dashboard',i:'◎',l:'Finance Dashboard'}]},
    {sec:'sec_finance', items:[
      {v:'invoices',i:'🧾',l:'All Requests'},
      {v:'settlements',i:'💳',l:'Settlement Tracking'},
    ]},
    {sec:'sec_admin', items:[{v:'reports',i:'📈',l:'Reports'},{v:'audit',i:'🗂️',l:'Audit Logs'}]},
  ],
  admin:[
    {sec:'sec_admin', items:[
      {v:'dashboard',i:'◎',l:'Admin Dashboard'},
      {v:'users',i:'👤',l:'User Management'},
      {v:'permissions',i:'🔐',l:'Roles & Permissions'},
      {v:'sitemap',i:'🗺️',l:'Information Architecture'},
      {v:'workflow',i:'🔀',l:'Workflow Visualization'},
      {v:'limits',i:'📐',l:'Limit Management'},
      {v:'audit',i:'🗂️',l:'Audit Logs'},
      {v:'buyers',i:'🏢',l:'Buyer Management'},
      {v:'suppliers',i:'📦',l:'Supplier Management'},
      {v:'invoices',i:'🧾',l:'All Invoices'},
    ]},
  ],
};

/* ---------------- MOCK DATA (Contact demo entities) ---------------- */
const BUYERS = [
  {id:'BUY-CRF', name:'Carrefour Egypt',   short:'Carrefour', cr:'CR-118420', email:'finance@carrefour.eg', phone:'+20 100 118 2420', brand:'#1B4DA1', limit:50000000, used:32000000, terms:'Net 60', buffer:'15 days', rate:'15.5%', bank:'CIB · 1100-4421', suppliers:['SUP-BIM','SUP-KHZ','SUP-ARG'], status:'active', concStatus:'Normal'},
  {id:'BUY-PEP', name:'Pepsi Egypt',       short:'Pepsi',     cr:'CR-203817', email:'ap@pepsi.eg',         phone:'+20 122 203 8170', brand:'#004B93', limit:30000000, used:29000000, terms:'Net 45', buffer:'10 days', rate:'16.0%', bank:'NBE · 8830-2210',  suppliers:['SUP-ARG','SUP-HMD'], status:'active', concStatus:'High'},
  {id:'BUY-EDT', name:'Edita Food',        short:'Edita',     cr:'CR-330091', email:'treasury@edita.eg',   phone:'+20 111 330 0910', brand:'#C8102E', limit:40000000, used:12400000, terms:'Net 60', buffer:'15 days', rate:'15.0%', bank:'QNB · 5521-0098',  suppliers:['SUP-KHZ'], status:'active', concStatus:'Normal'},
  {id:'BUY-SAU', name:'Saudi Markets',     short:'Saudi',     cr:'CR-559002', email:'finance@saudimkt.eg', phone:'+20 100 559 0020', brand:'#2E7D32', limit:25000000, used:9000000,  terms:'Net 45', buffer:'12 days', rate:'15.8%', bank:'AAIB · 9912-3380', suppliers:['SUP-BIM'], status:'active', concStatus:'Normal'},
  {id:'BUY-MEF', name:'Mahmoud El Far',    short:'El Far',    cr:'CR-447090', email:'ap@elfar.eg',         phone:'+20 111 447 0900', brand:'#E8730C', limit:20000000, used:18500000, terms:'Net 90', buffer:'20 days', rate:'14.8%', bank:'Banque Misr · 3300-1120', suppliers:['SUP-HMD'], status:'pending', concStatus:'Elevated'},
];
const SUPPLIERS = [
  {id:'SUP-BIM', name:'BIM Stores',            short:'BIM',          cr:'CR-771204', email:'ar@bim.eg',        phone:'+20 100 771 2040', model:'reverse', buyers:['BUY-CRF','BUY-SAU'], shareOfSales:'34%', since:'2019', limit:18000000, used:11500000, conc:'35%', terms:'Net 60', rate:'15.5%', bank:'CIB · 2210-7781', status:'active'},
  {id:'SUP-KHZ', name:'Kheir Zaman',           short:'Kheir Zaman',  cr:'CR-664823', email:'finance@kheirzaman.eg', phone:'+20 122 664 8230', model:'reverse', buyers:['BUY-CRF','BUY-EDT'], shareOfSales:'21%', since:'2020', limit:16000000, used:7400000,  conc:'25%', terms:'Net 60', rate:'15.5%', bank:'AAIB · 9912-3380', status:'active'},
  {id:'SUP-ARG', name:'Awlad Ragab',           short:'Awlad Ragab',  cr:'CR-559017', email:'collections@awladragab.eg', phone:'+20 111 559 0170', model:'normal',  buyers:['BUY-CRF','BUY-PEP'], shareOfSales:'—',  since:'2018', limit:22000000, used:13800000, conc:'40%', terms:'Net 45', rate:'14.5%', bank:'Banque Misr · 3300-1120', status:'active', recourse:true, disclosure:'disclosed'},
  {id:'SUP-HMD', name:'Super Market El Hamd',  short:'El Hamd',      cr:'CR-882140', email:'ap@elhamd.eg',     phone:'+20 100 882 1400', model:'normal',  buyers:['BUY-PEP','BUY-MEF'], shareOfSales:'—',  since:'2021', limit:12000000, used:6500000,  conc:'45%', terms:'Net 90', rate:'14.8%', bank:'QNB · 8810-2099', status:'active', recourse:true, disclosure:'silent'},
];

/* ---------------- PROFILE APPROVAL CYCLE (Credit + Legal) ---------------- */
/* RM creates a profile → Credit review → Legal review → Active.
   Each team can approve, reject (return to RM), comment to the RM, or flag missing documents. */
let PA_SEQ = 5001;
const PROFILE_APPROVALS = [
  { id:'PA-'+(PA_SEQ++), kind:'buyer',    entityId:'BUY-MEF', name:'Mahmoud El Far', cr:'CR-447090', submittedBy:'Yara Mansour (RM)', submittedOn:'2026-06-10',
    credit:{status:'pending', by:null, on:null, note:''}, legal:{status:'waiting', by:null, on:null, note:''},
    docs:[{n:'Commercial Register.pdf',ok:true},{n:'Tax Card.pdf',ok:true},{n:'Board Resolution.pdf',ok:false},{n:'Bank Mandate.pdf',ok:true},{n:'Audited Financials FY25.pdf',ok:false}],
    comments:[] },
  { id:'PA-'+(PA_SEQ++), kind:'supplier', entityId:'SUP-HMD', name:'Super Market El Hamd', cr:'CR-882140', submittedBy:'Yara Mansour (RM)', submittedOn:'2026-06-09',
    credit:{status:'approved', by:'Tarek Fouad', on:'2026-06-10', note:'Risk grade BBB. Limit EGP 12M endorsed.'}, legal:{status:'pending', by:null, on:null, note:''},
    docs:[{n:'Commercial Register.pdf',ok:true},{n:'Tax Card.pdf',ok:true},{n:'Recourse Agreement.pdf',ok:true},{n:'KYC Pack.pdf',ok:false}],
    comments:[{by:'Tarek Fouad (Credit)',on:'2026-06-10',text:'Approved from credit side; full recourse documented. Legal to confirm escrow clauses.'}] },
  { id:'PA-'+(PA_SEQ++), kind:'supplier', entityId:'SUP-ARG', name:'Awlad Ragab', cr:'CR-559017', submittedBy:'Yara Mansour (RM)', submittedOn:'2026-06-08',
    credit:{status:'approved', by:'Tarek Fouad', on:'2026-06-09', note:'Within appetite.'}, legal:{status:'approved', by:'Mona Adel', on:'2026-06-10', note:'Contracts in order.'},
    docs:[{n:'Commercial Register.pdf',ok:true},{n:'Tax Card.pdf',ok:true},{n:'Factoring Agreement.pdf',ok:true}],
    comments:[] },
  { id:'PA-'+(PA_SEQ++), kind:'buyer',    entityId:'BUY-PEP', name:'Pepsi Egypt', cr:'CR-203817', submittedBy:'Yara Mansour (RM)', submittedOn:'2026-06-07',
    credit:{status:'returned', by:'Tarek Fouad', on:'2026-06-08', note:'Concentration cap unclear; resubmit with global limit.'}, legal:{status:'waiting', by:null, on:null, note:''},
    docs:[{n:'Commercial Register.pdf',ok:true},{n:'Tax Card.pdf',ok:false}],
    comments:[{by:'Tarek Fouad (Credit)',on:'2026-06-08',text:'Returned to RM — please attach the Tax Card and confirm the global concentration limit before re-submitting.'}] },
];
function paOverall(p){
  if(p.credit.status==='modified'||p.legal.status==='modified') return {l:'Modified — re-review', c:'submitted'};
  if(p.credit.status==='returned'||p.legal.status==='returned') return {l:'Returned to RM', c:'rejected'};
  if(p.credit.status==='approved'&&p.legal.status==='approved') return {l:'Active', c:'settled'};
  if(p.credit.status==='pending') return {l:'Credit review', c:'credit'};
  if(p.legal.status==='pending') return {l:'Legal review', c:'pendingbuyer'};
  return {l:'In review', c:'fra'};
}
function paQueueFor(team){ return PROFILE_APPROVALS.filter(p=>p[team] && (p[team].status==='pending'||p[team].status==='modified')); }
function countProfile(team){ return paQueueFor(team).length; }
let CASE_SEQ = 1042;
function mkAudit(actor, action, note){ return {ts:nowStr(), actor, action, note:note||''}; }
const cases = [
  c('reverse','buyer','BUY-CRF','SUP-BIM', 4250000,'INV-2026-0412','2026-05-28','2026-07-27','settled',{}),
  c('reverse','buyer','BUY-CRF','SUP-KHZ', 1880000,'INV-2026-0418','2026-06-01','2026-07-31','funded',{}),
  c('reverse','supplier','BUY-CRF','SUP-BIM', 3120000,'INV-2026-0431','2026-06-05','2026-08-04','pendingbuyer',{}),
  c('reverse','supplier','BUY-EDT','SUP-KHZ', 2640000,'INV-2026-0433','2026-06-06','2026-07-21','pendingbuyer',{}),
  c('reverse','buyer','BUY-SAU','SUP-BIM',   960000,'INV-2026-0440','2026-06-07','2026-07-22','fra',{}),
  c('reverse','buyer','BUY-CRF','SUP-BIM', 5400000,'INV-2026-0444','2026-06-08','2026-08-07','deviation',{flagConc:true}),
  c('reverse','supplier','BUY-EDT','SUP-KHZ', 1450000,'INV-2026-0447','2026-06-08','2026-07-23','credit',{}),
  c('reverse','buyer','BUY-CRF','SUP-KHZ', 2210000,'INV-2026-0451','2026-06-09','2026-08-08','approved',{}),
  c('reverse','buyer','BUY-SAU','SUP-BIM', 1130000,'INV-2026-0455','2026-06-09','2026-07-24','submitted',{}),
  c('reverse','supplier','BUY-CRF','SUP-BIM',  780000,'INV-2026-0460','2026-06-10','2026-08-09','rejected',{rejFrom:'fra'}),
  c('reverse','buyer','BUY-CRF','SUP-KHZ', 1600000,'INV-2026-0462','2026-06-10','2026-08-09','draft',{}),
  /* Normal / recourse */
  c('normal','supplier','BUY-CRF','SUP-ARG', 6800000,'INV-2026-0466','2026-06-04','2026-08-03','funded',{recourse:true,disclosure:'disclosed'}),
  c('normal','supplier','BUY-PEP','SUP-ARG', 3300000,'INV-2026-0470','2026-06-07','2026-08-06','credit',{recourse:true,disclosure:'disclosed'}),
  c('normal','supplier','BUY-PEP','SUP-HMD', 2900000,'INV-2026-0473','2026-06-08','2026-09-06','deviation',{recourse:true,disclosure:'silent',flagConc:true}),
  c('normal','supplier','BUY-MEF','SUP-HMD', 1750000,'INV-2026-0477','2026-06-09','2026-09-08','fra',{recourse:true,disclosure:'silent'}),
  c('normal','supplier','BUY-CRF','SUP-ARG', 4100000,'INV-2026-0480','2026-06-10','2026-08-09','approved',{recourse:true,disclosure:'disclosed',ackEscrow:false}),
  c('normal','supplier','BUY-PEP','SUP-HMD', 2050000,'INV-2026-0483','2026-06-10','2026-08-09','settled',{recourse:true,disclosure:'silent'}),
  /* Silent factoring — escrow collection, buyer NOT notified, acknowledgement pending */
  c('normal','supplier','BUY-MEF','SUP-HMD', 2400000,'INV-2026-0486','2026-06-10','2026-09-08','funded',{recourse:true,disclosure:'silent',ackEscrow:false}),
  c('normal','supplier','BUY-PEP','SUP-HMD', 1850000,'INV-2026-0489','2026-06-11','2026-09-09','approved',{recourse:true,disclosure:'silent',ackEscrow:false}),
];
function c(type,initiator,buyerId,supplierId,amount,invoiceNo,issue,due,stage,extra){
  extra=extra||{};
  const b=BUYERS.find(x=>x.id===buyerId), s=SUPPLIERS.find(x=>x.id===supplierId);
  const id='REQ-'+(CASE_SEQ++);
  return {
    id, ref:id, type, initiator, buyerId, supplierId,
    buyer:b?b.name:buyerId, supplier:s?s.name:supplierId,
    amount, currency:'EGP', invoiceNo, issue, due, terms:b?b.terms:'Net 60',
    stage, prevStage:null, rejFrom:extra.rejFrom||null,
    recourse: type==='normal' ? true : !!extra.recourse,
    disclosure: extra.disclosure||null, flagConc: !!extra.flagConc,
    ackEscrow: extra.ackEscrow!==undefined?extra.ackEscrow:(extra.disclosure==='silent'?false:true),
    bulk:false,
    fraStatus: stage==='fra'?'pending':(['draft','submitted','pendingbuyer','rejected'].includes(stage)?'—':'validated'),
    fraNotes:'',
    docs:[ {n:'Commercial invoice.pdf',t:'Invoice',sz:'214 KB'},{n:'Delivery note.pdf',t:'Proof of delivery',sz:'88 KB'} ],
    notes:'',
    audit:[ mkAudit(initiator==='buyer'?'Buyer':'Supplier','Request created','Invoice uploaded to portal') ],
  };
}

/* ---------------- DATA HELPERS ---------------- */
function countStage(s){ return cases.filter(c=>c.stage===s).length; }
function pendingForBuyer(){ const me=myBuyer(); return cases.filter(c=>c.stage==='pendingbuyer' && (!me||c.buyerId===me.id)); }
function escrowPending(){ const me=mySupplier(); return cases.filter(c=>c.disclosure==='silent' && !c.ackEscrow && ['approved','funded'].includes(c.stage) && (!me||c.supplierId===me.id)); }
function myBuyer(){ return findBuyer(state.activeBuyerId) || BUYERS[0]; }
function mySupplier(){ return findSupplier(state.activeSupplierId) || SUPPLIERS[0]; }
function myCases(){
  if(state.role==='buyer'){const me=myBuyer();return cases.filter(c=>c.buyerId===me.id);}
  if(state.role==='supplier'){const me=mySupplier();return cases.filter(c=>c.supplierId===me.id);}
  return cases.slice();
}
function findCase(id){ return cases.find(c=>c.id===id); }
function findBuyer(id){ return BUYERS.find(b=>b.id===id); }
function findSupplier(id){ return SUPPLIERS.find(s=>s.id===id); }

/* ---------------- FORMAT ---------------- */
function money(n){ return Number(n).toLocaleString('en-US'); }
function egp(n){ return 'EGP '+money(n); }
function egpC(n){ return egp(n).replace('EGP ','<span class="cur">EGP</span>'); }
function mShort(n){ return n>=1e6?(n/1e6).toFixed(n%1e6?1:0)+'M':n>=1e3?(n/1e3).toFixed(0)+'K':n; }
function nowStr(){ const d=new Date(); return d.toISOString().slice(0,10)+' '+d.toTimeString().slice(0,5); }
function initials(s){ return s.split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase(); }
function colorFor(s){ let h=0; for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%360; return `hsl(${h} 45% 45%)`; }
function avatarStyle(name){ const col=colorFor(name); return `background:${col}1c;color:${col}`; }

/* ---------------- STATE ---------------- */
const state = { role:'rm', view:'dashboard', lang:'en', theme:'light', param:null, tab:null, notifOpen:false, pmenuOpen:false, activeBuyerId:'BUY-CRF', activeSupplierId:'SUP-BIM' };
const notifications = [
  {role:'buyer', icon:'⏳', bg:'#FCEDE2', col:'#C2410C', title:'Supplier invoice awaiting your validation', body:'BIM Stores submitted INV-2026-0431 (EGP 3,120,000).', time:'2h ago', unread:true},
  {role:'supplier', icon:'🏦', bg:'#F4E8FC', col:'#9333EA', title:'Instant SWIFT confirmation', body:'INV-2026-0466 funded — advance disbursed to your account.', time:'5h ago', unread:true},
  {role:'rm', icon:'⚖️', bg:'#F1E9FD', col:'#7C3AED', title:'Concentration breach flagged', body:'INV-2026-0444 routed to Deviation Committee for allocation.', time:'1d ago', unread:true},
  {role:'rm', icon:'⚠️', bg:'#FEF1E0', col:'#B5651A', title:'Pepsi near limit', body:'Available headroom EGP 1,000,000 — review concentration.', time:'1d ago', unread:false},
  {role:'fra', icon:'🛡️', bg:'#ECEBFB', col:'#4F46E5', title:'2 invoices pending FRA validation', body:'New e-invoice checks required before processing.', time:'3h ago', unread:true},
  {role:'finance', icon:'💳', bg:'#E6F3EB', col:'#15803D', title:'Approved request ready to fund', body:'INV-2026-0451 cleared all gates — ready for disbursement.', time:'4h ago', unread:true},
  {role:'credit', icon:'📊', bg:'#E1F2F6', col:'#0E7490', title:'Credit review requested', body:'INV-2026-0447 passed concentration checks.', time:'6h ago', unread:false},
  {role:'deviation', icon:'⚖️', bg:'#F1E9FD', col:'#7C3AED', title:'Allocation review pending', body:'2 buyers flagged for limit / concentration exceedances.', time:'7h ago', unread:true},
];
function myNotifs(){ return notifications.filter(n=>n.role===state.role || n.role==='all'); }


/* ============================================================
   PART 2 — HELPERS · AUTH · SHELL
   ============================================================ */
const $ = s=>document.querySelector(s);
const el = id=>document.getElementById(id);

function badge(stage){ const m=STAGE[stage]||STAGE.draft; return `<span class="badge-st ${m.cls}"><i class="bd"></i>${m.label}</span>`; }
function typeTag(c){ return c.type==='reverse'?`<span class="tag reverse">⇄ Reverse</span>`:`<span class="tag normal">⟳ Normal</span>`; }
function discTag(c){ if(!c.disclosure)return ''; return c.disclosure==='disclosed'?`<span class="tag disclosed">Disclosed</span>`:`<span class="tag silent">Silent</span>`; }
function party(name,sub){ return `<div class="party"><span class="pav" style="${avatarStyle(name)}">${initials(name)}</span><div><div class="t-strong">${name}</div>${sub?`<div class="t-sub">${sub}</div>`:''}</div></div>`; }
function pipeline(c){
  if(state.role && ROLES[state.role] && !ROLES[state.role].internal) return clientPipeline(c);
  const ch=chainFor(c); const cur=c.stage; let curIdx=ch.indexOf(cur); const rejected=cur==='rejected';
  if(rejected) curIdx=ch.indexOf(c.rejFrom||'fra');
  let html='<div class="pipe-rail">';
  ch.forEach((s,i)=>{
    let cls=''; if(rejected){ if(i<curIdx)cls='done'; else if(i===curIdx)cls='rejected'; }
    else { if(i<curIdx)cls='done'; else if(i===curIdx)cls='current'; }
    const m=STAGE[s]; const mark=cls==='done'?'✓':(cls==='rejected'?'✕':(i+1));
    html+=`<div class="pipe-step ${cls}"><div class="ps-line"></div><div class="ps-dot">${mark}</div><div class="ps-lab">${m.short}</div></div>`;
  });
  return html+'</div>';
}
// Simplified client-facing stage bar — internal review stages (FRA / committee / credit) are hidden from buyers & suppliers.
function clientPipeline(c){
  const supplier = state.role==='supplier';
  const labels = supplier
    ? ['Submitted','Buyer Validation','Approved','Funded','Settled','Closed']
    : ['Submitted','Under Validation','Approved','Funded','Settled','Closed'];
  const map={ draft:0, submitted:0, pendingbuyer:1, fra:1, deviation:1, credit:1, approved:2, funded:3, settled:4, closed:5 };
  const rejected = c.stage==='rejected';
  const curIdx = rejected ? (map[c.rejFrom]!==undefined?map[c.rejFrom]:1) : (map[c.stage]!==undefined?map[c.stage]:0);
  let html='<div class="pipe-rail">';
  labels.forEach((lab,i)=>{
    let cls=''; if(rejected){ if(i<curIdx)cls='done'; else if(i===curIdx)cls='rejected'; }
    else { if(i<curIdx)cls='done'; else if(i===curIdx)cls='current'; }
    const mark=cls==='done'?'✓':(cls==='rejected'?'✕':(i+1));
    html+=`<div class="pipe-step ${cls}"><div class="ps-line"></div><div class="ps-dot">${mark}</div><div class="ps-lab">${lab}</div></div>`;
  });
  return html+'</div>';
}
function caseTable(list, opts){
  opts=opts||{};
  if(!list.length) return emptyState(opts.emptyTitle||'Nothing here yet', opts.emptyBody||'Items appear here as they move through the workflow.', opts.emptyIcon||'🗂️');
  const rows=list.map(c=>`
    <tr class="row-link" onclick="openCase('${c.id}')">
      <td><div class="t-strong mono">${c.invoiceNo}</div><div class="t-sub mono">${c.ref}</div></td>
      <td>${party(c.supplier,'Supplier')}</td>
      <td>${party(c.buyer,'Buyer')}</td>
      <td class="t-amt">${egp(c.amount)}</td>
      <td>${badge(c.stage)}</td>
      <td class="t-sub mono">${c.due}</td>
      ${opts.actions?`<td onclick="event.stopPropagation()">${opts.actions(c)}</td>`:''}
    </tr>`).join('');
  return `<div class="card"><div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Invoice / Ref</th><th>Supplier</th><th>Buyer</th>
      <th style="text-align:end">Amount</th><th>Status</th><th>Due</th>${opts.actions?'<th>Action</th>':''}</tr></thead>
    <tbody>${rows}</tbody></table></div></div>`;
}
function emptyState(title,body,icon){ return `<div class="card card-pad"><div class="empty"><div class="ei">${icon||'🗂️'}</div><h4>${title}</h4><p>${body||''}</p></div></div>`; }
function stat(lab,val,icon,bg,col,delta,deltaCls){
  return `<div class="stat"><div class="lab"><span class="ic" style="background:${bg};color:${col}">${icon}</span>${lab}</div>
    <div class="val">${val}</div>${delta?`<div class="delta ${deltaCls||'flat'}">${delta}</div>`:''}</div>`;
}
function pageHead(eyebrow,title,desc,actions){
  return `<div class="page-head"><div><div class="ph-eyebrow">${eyebrow}</div><h1>${title}</h1>${desc?`<p>${desc}</p>`:''}</div>${actions?`<div class="ph-actions">${actions}</div>`:''}</div>`;
}
function tabBar(items){ return `<div class="tabs">${items.map(it=>`<button class="tab ${(state.tab||items[0].id)===it.id?'active':''}" onclick="state.tab='${it.id}';route()">${it.label}</button>`).join('')}</div>`; }
function auditTimeline(items){
  if(!items.length) return `<div class="card card-pad"><p class="t-sub">No audit events yet.</p></div>`;
  return `<div class="card card-pad"><div class="timeline">${items.map(a=>`<div class="tl-item ${a.action&&a.action.toLowerCase().includes('reject')?'rej':''}"><div class="tl-dot"></div><b>${a.action}</b><div class="tl-meta">${a.actor} · ${a.ts}</div>${a.note?`<p>${a.note}</p>`:''}</div>`).join('')}</div></div>`;
}
function limitBar(name,used,limit){
  const pct=Math.min(100,Math.round(used/limit*100)); const over=used>limit;
  return `<div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:6px"><span class="t-strong">${name}</span><span class="t-sub mono">${Math.round(used/limit*100)}% · ${egp(used)}/${egp(limit)}</span></div><div class="progress"><i style="width:${pct}%${over?';background:linear-gradient(90deg,#E0796F,#B42318)':''}"></i></div></div>`;
}
function fld(label,type,ph,req){ return `<div class="fld"><label>${label}${req?' <span class="req">*</span>':''}</label><input type="${type||'text'}" placeholder="${ph||''}"></div>`; }

/* ---------------- AUTH (two tabs · glassmorphism) ---------------- */
let authState = {tab:'ops', screen:'login', clientKind:'buyer', portal:null};
let otpTimer=null;
function fakeQR(){
  let cells=''; const n=11; let seed=7;
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){ seed=(seed*1103515245+12345)&0x7fffffff; const on=((seed>>16)&1) || (x<3&&y<3)||(x>n-4&&y<3)||(x<3&&y>n-4);
    if(on) cells+=`<rect x="${x*5+1}" y="${y*5+1}" width="4" height="4" rx="1" fill="#101039"/>`; }
  return `<svg viewBox="0 0 ${n*5+2} ${n*5+2}" width="100%" height="100%">${cells}</svg>`;
}
function qrCard(){
  return `<div class="qr-card"><div class="qr">${fakeQR()}</div><div><h4>Download our mobile app</h4><p>Scan to manage factoring on the go.</p>
    <div class="stores"><span>🍎 App Store</span><span>▶ Google Play</span></div></div></div>`;
}
/* ---------------- DEMO USERS (prototype sign-in) ---------------- */
const DEMO_PASSWORD='Demo@2026';
const DEMO_OTP='202611';
const DEMO_USERS={
  internal:[
    {name:'Walaa Yusuf',email:'walaa.yusuf@contact.eg',role:'rm'},
    {name:'Pierre',email:'pierre@contact.eg',role:'credit'},
    {name:'Doaa Orfy',email:'doaa.orfy@contact.eg',role:'legal'},
    {name:'Emad Ashour',email:'emad.ashour@contact.eg',role:'finance'},
    {name:'Hany Greiss',email:'committee@contact.eg',role:'deviation'},
    {name:'System Admin',email:'admin@contact.eg',role:'admin'},
  ],
  clients:[
    {name:'Carrefour Egypt',mobile:'+20 100 118 2420',kind:'buyer',id:'BUY-CRF'},
    {name:'Pepsi Egypt',mobile:'+20 122 203 8170',kind:'buyer',id:'BUY-PEP'},
    {name:'BIM Stores',mobile:'+20 100 771 2040',kind:'supplier',id:'SUP-BIM'},
    {name:'Awlad Ragab',mobile:'+20 111 559 0170',kind:'supplier',id:'SUP-ARG'},
    {name:'Super Market El Hamd',mobile:'+20 100 882 1400',kind:'supplier',id:'SUP-HMD'},
  ],
};
function setPortal(p){ authState.portal=p; authState.screen='login'; if(p==='employee')authState.tab='ops'; if(p==='client')authState.tab='client'; try{location.hash=p?('#'+p):'';}catch(e){} renderAuth(); }
function demoLogin(role,entityId){ if(role==='buyer'){ if(entityId)state.activeBuyerId=entityId; } else if(role==='supplier'){ if(entityId)state.activeSupplierId=entityId; } enterApp(role); }
function demoPanel(which){
  const mini=(label,sub,icon,onclick)=>`<button onclick="${onclick}"><span class="ric">${icon}</span><span style="min-width:0"><b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${label}</b><small style="opacity:.8">${sub}</small></span></button>`;
  const ops=DEMO_USERS.internal.map(u=>mini(u.name,ROLES[u.role].name,ROLES[u.role].icon,`demoLogin('${u.role}')`)).join('');
  const cli=DEMO_USERS.clients.map(u=>mini(u.name,u.kind==='buyer'?'Buyer':'Supplier',u.kind==='buyer'?'🏢':'📦',`demoLogin('${u.kind}','${u.id}')`)).join('');
  if(which==='employee') return `<div class="qr-card" style="flex-direction:column;align-items:stretch;gap:10px"><div><h4 style="margin-bottom:2px">Quick demo login — Employees</h4><p style="margin:0">One-click sign-in as any internal role.</p></div><div class="role-mini">${ops}</div></div>`;
  if(which==='client') return `<div class="qr-card" style="flex-direction:column;align-items:stretch;gap:10px"><div><h4 style="margin-bottom:2px">Quick demo login — Clients</h4><p style="margin:0">One-click sign-in as a buyer or supplier.</p></div><div class="role-mini">${cli}</div></div>`;
  return '';
}
function paResubmit(id){ const p=PROFILE_APPROVALS.find(x=>x.id===id); if(!p)return;
  if(p.credit.status!=='returned'&&p.legal.status!=='returned'){ toast('Nothing to resubmit — no team returned this profile','warn','ℹ️'); return; }
  ['credit','legal'].forEach(tm=>{ if(p[tm].status==='returned'){ p[tm]={status:'modified', by:null, on:null, note:'Updated & resubmitted by RM'}; } });
  p.docs.forEach(d=>d.ok=true); p.modified=true;
  p.comments.push({by:ROLES[state.role].user+' (RM)', on:'2026-06-14', text:'Updated the profile and resubmitted. Missing documents provided. Please re-review.'});
  toast('Profile updated & resubmitted — back in the review queue as “Modified”','ok','🔁');
  renderSidebar(); route();
}
function renderAuth(){
  const a=el('auth');
  let card='';
  if(authState.screen==='login' && !authState.portal){
    card=`<div class="glass">
      <h2>Welcome to Contact Factoring</h2><div class="gsub">Choose how you'd like to sign in.</div>
      <div class="role-mini" style="grid-template-columns:1fr;gap:10px;margin-top:6px">
        <button onclick="setPortal('employee')"><span class="ric">🧭</span><span style="min-width:0"><b style="display:block">Employee Portal</b><small style="opacity:.8">RM · Credit · Legal & internal teams — email & password</small></span></button>
        <button onclick="setPortal('client')"><span class="ric">🏢</span><span style="min-width:0"><b style="display:block">Client Portal</b><small style="opacity:.8">Buyers & Suppliers — mobile number & OTP</small></span></button>
      </div>
      <div class="gnote" style="margin-top:16px">Separate sign-in for staff and clients. <b>Prototype — no real credentials needed.</b></div>
    </div>`;
  } else if(authState.screen==='login'){
    const emp=authState.portal==='employee';
    card=`<div class="glass">
      <button class="gback" onclick="setPortal(null)">← Choose portal</button>
      <h2>${emp?'Employee sign in':'Client sign in'}</h2><div class="gsub">${emp?'Internal teams — RM, Credit, Legal, Finance, FRA, Deviation, Admin.':'Buyers & Suppliers access their requests.'}</div>
      ${emp?opsForm():clientForm()}
      <div class="gnote">${emp?'Authenticate with your Contact email & password.':'Authenticate with mobile number & OTP.'} <b>Prototype — no real credentials needed.</b></div>
    </div>${demoPanel(authState.portal)}${qrCard()}`;
  } else if(authState.screen==='otp'){
    card=`<div class="glass">
      <button class="gback" onclick="authGo('login')">← Back</button>
      <h2>Verify your number</h2><div class="gsub">Enter the 6-digit code sent to your registered mobile.</div>
      <div class="otp-row">${[2,0,2,6,1,1].map(d=>`<input maxlength="1" value="${d}" oninput="otpNext(this)">`).join('')}</div>
      <div class="otp-meta" id="otpMeta">Resend code available in <span class="cd" id="otpCd">00:10</span></div>
      <div id="otpResend" class="resend hidden"><button onclick="resendOtp('SMS')">✉️ Resend via SMS</button><button onclick="resendOtp('WhatsApp')">🟢 Resend via WhatsApp</button></div>
      <button class="gbtn" onclick="verifyOtp()">Verify & continue</button>
    </div>${qrCard()}`;
  } else if(authState.screen.startsWith('fp')){
    card=`<div class="glass">${forgotFlow()}</div>`;
  }
  a.innerHTML=`<div class="auth-bg"><div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div><div class="rings"></div></div>
    <div class="auth-wrap">
      <div class="auth-logo"><img src="${LOGO}" alt="Contact"><div class="nm"><b>Contact Factoring</b><span>Digital Factoring · Supply Chain Finance</span></div></div>
      ${card}
      <div class="auth-foot">Contact Financial Holding · Bilingual AR / EN · Prototype v2</div>
    </div>`;
  if(authState.screen==='otp') startCountdown();
}
function opsForm(){
  return `<div class="gfield"><label>Team</label><div class="gin"><span class="ic">🛡️</span>
      <select id="opsTeam" style="flex:1;background:transparent;border:none;color:#fff;padding:13px 0;font-size:14px">
        ${['rm','credit','legal','finance','deviation','admin'].map(k=>`<option value="${k}" style="color:#111">${ROLES[k].name}</option>`).join('')}
      </select></div></div>
    <div class="gfield"><label>Email address</label><div class="gin"><span class="ic">✉️</span><input id="opsEmail" type="email" placeholder="name@contact.eg" value="yara.mansour@contact.eg"></div></div>
    <div class="gfield"><label>Password</label><div class="gin"><span class="ic">🔒</span><input id="opsPass" type="password" placeholder="••••••••" value="Demo@2026"><button class="eye" onclick="togglePass(this)">👁</button></div></div>
    <div class="grow"><label><input type="checkbox" checked>Remember me</label><button class="glink" onclick="authGo('fp1')">Forgot password?</button></div>
    <button class="gbtn" onclick="doOps()">Sign in</button>`;
}
function clientForm(){
  const isBuyer=authState.clientKind==='buyer';
  return `<div class="atabs" style="margin-bottom:16px">
      <button class="${isBuyer?'on':''}" onclick="authClient('buyer')" style="flex-direction:row;gap:7px">🏢 Buyer</button>
      <button class="${!isBuyer?'on':''}" onclick="authClient('supplier')" style="flex-direction:row;gap:7px">📦 Supplier</button>
    </div>
    <div class="gfield"><label>${isBuyer?'Buyer company':'Supplier company'}</label><div class="gin"><span class="ic">${isBuyer?'🏢':'📦'}</span>
      <select id="clientCo" style="flex:1;background:transparent;border:none;color:#fff;padding:13px 0;font-size:14px">
        ${(isBuyer?BUYERS:SUPPLIERS).map(x=>`<option value="${x.id}" style="color:#111">${x.name}</option>`).join('')}
      </select></div></div>
    <div class="gfield"><label>Mobile number</label><div class="gin"><span class="ic">📱</span><input id="clientMobile" type="tel" placeholder="+20 1XX XXX XXXX" value="${isBuyer?'+20 100 118 2420':'+20 100 771 2040'}"></div></div>
    <button class="gbtn" onclick="sendOtp()">Send OTP</button>`;
}
function forgotFlow(){
  const step={fp1:0,fp2:1,fp3:2,fp4:3}[authState.screen];
  const bar=`<div class="steps">${[0,1,2,3].map(i=>`<i class="${i<=step?'on':''}"></i>`).join('')}</div>`;
  if(authState.screen==='fp1') return `<button class="gback" onclick="authGo('login')">← Back to sign in</button>${bar}<h2>Reset password</h2><div class="gsub">Enter your Contact email and we'll send a verification code.</div>
    <div class="gfield"><label>Email address</label><div class="gin"><span class="ic">✉️</span><input type="email" placeholder="name@contact.eg" value="yara.mansour@contact.eg"></div></div>
    <button class="gbtn" onclick="authGo('fp2')">Send verification code</button>`;
  if(authState.screen==='fp2') return `<button class="gback" onclick="authGo('fp1')">← Back</button>${bar}<h2>Enter verification code</h2><div class="gsub">We sent a 6-digit code to your email.</div>
    <div class="otp-row">${[4,8,2,9,0,3].map(d=>`<input maxlength="1" value="${d}" oninput="otpNext(this)">`).join('')}</div>
    <div class="otp-meta">Didn't get it? <button class="glink" onclick="toast('Code re-sent','ok','✉️')">Resend code</button></div>
    <button class="gbtn" onclick="authGo('fp3')">Verify code</button>`;
  if(authState.screen==='fp3') return `<button class="gback" onclick="authGo('fp2')">← Back</button>${bar}<h2>Set a new password</h2><div class="gsub">Choose a strong password for your account.</div>
    <div class="gfield"><label>New password</label><div class="gin"><span class="ic">🔒</span><input type="password" placeholder="••••••••" value="prototype1"><button class="eye" onclick="togglePass(this)">👁</button></div></div>
    <div class="gfield"><label>Confirm password</label><div class="gin"><span class="ic">🔒</span><input type="password" placeholder="••••••••" value="prototype1"></div></div>
    <button class="gbtn" onclick="authGo('fp4')">Update password</button>`;
  if(authState.screen==='fp4') return `${bar}<div style="text-align:center;padding:14px 0 4px"><div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent-2));display:grid;place-items:center;margin:0 auto 16px;font-size:30px">✓</div>
    <h2>Password updated</h2><div class="gsub" style="margin-bottom:20px">Your password has been reset successfully. You can now sign in.</div></div>
    <button class="gbtn" onclick="authGo('login')">Back to sign in</button>`;
}
function authTab(tb){ authState.tab=tb; renderAuth(); }
function authClient(k){ authState.clientKind=k; renderAuth(); }
function authGo(s){ if(otpTimer){clearInterval(otpTimer);otpTimer=null;} authState.screen=s; renderAuth(); }
function togglePass(btn){ const inp=btn.previousElementSibling; inp.type=inp.type==='password'?'text':'password'; }
function otpNext(input){ if(input.value && input.nextElementSibling && input.nextElementSibling.tagName==='INPUT') input.nextElementSibling.focus(); }
function startCountdown(){
  let n=10; const cd=el('otpCd'); if(!cd) return;
  if(otpTimer) clearInterval(otpTimer);
  otpTimer=setInterval(()=>{ n--; if(n<=0){ clearInterval(otpTimer); otpTimer=null; const m=el('otpMeta'),r=el('otpResend'); if(m)m.innerHTML="Didn't receive the code?"; if(r)r.classList.remove('hidden'); }
    else if(cd){ cd.textContent='00:'+String(n).padStart(2,'0'); } },1000);
}
function resendOtp(via){ toast('OTP re-sent via '+via,'ok',via==='SMS'?'✉️':'🟢'); const m=el('otpMeta'),r=el('otpResend'); if(r)r.classList.add('hidden'); if(m)m.innerHTML='Resend code available in <span class="cd" id="otpCd">00:10</span>'; startCountdown(); }
function doOps(){
  const email=(el('opsEmail')?el('opsEmail').value:'').trim().toLowerCase();
  const u=DEMO_USERS.internal.find(x=>x.email.toLowerCase()===email);
  const team=u?u.role:(el('opsTeam')?el('opsTeam').value:'rm');
  enterApp(team);
}
function sendOtp(){
  let id=el('clientCo')?el('clientCo').value:null;
  const mob=(el('clientMobile')?el('clientMobile').value:'').replace(/\s/g,'');
  const m=DEMO_USERS.clients.find(x=>x.mobile.replace(/\s/g,'')===mob);
  if(m){ authState.clientKind=m.kind; id=m.id; }
  if(authState.clientKind==='buyer'){ if(id)state.activeBuyerId=id; } else { if(id)state.activeSupplierId=id; }
  authGo('otp');
}
function verifyOtp(){ if(otpTimer){clearInterval(otpTimer);otpTimer=null;} enterApp(authState.clientKind); }
function enterApp(role){
  state.role=role; state.view='dashboard'; state.param=null; state.tab=null; state.hist=[];
  if(role==='buyer'){ const b=myBuyer(); ROLES.buyer.user=b.name; ROLES.buyer.company=b.name; ROLES.buyer.email=b.email; ROLES.buyer.mobile=b.phone; }
  if(role==='supplier'){ const s=mySupplier(); ROLES.supplier.user=s.name; ROLES.supplier.company=s.name; ROLES.supplier.email=s.email; ROLES.supplier.mobile=s.phone; }
  el('auth').style.display='none'; el('app').style.display='block';
  renderShell(); toast('Signed in as '+ROLES[role].name,'brand','✓');
}
function logout(){ state.pmenuOpen=false; el('app').style.display='none'; el('auth').style.display='grid'; authState={tab:'ops',screen:'login',clientKind:'buyer',portal:null}; renderAuth(); }

/* ---------------- SHELL ---------------- */
function renderShell(){ renderSidebar(); renderTopbar(); renderNotifPanel(); route(); }
function renderSidebar(){
  const r=ROLES[state.role]; const nav=NAV[state.role]||[];
  const items=nav.map(sec=>`<div class="nav-sec">${t(sec.sec)}</div>
    ${sec.items.map(it=>{ const b=it.badge?it.badge():0;
      return `<button class="nav-item ${state.view===it.v?'active':''}" onclick="go('${it.v}')"><span class="ni-ic">${it.i}</span><span>${it.l}</span>${b?`<span class="badge">${b}</span>`:''}</button>`;}).join('')}`).join('');
  el('sidebar').innerHTML=`
    <div class="sb-brand"><img src="${LOGO}" alt="Contact"><div><b>Contact Factoring</b><span>${t('sys')}</span></div></div>
    <div class="sb-role"><span class="dot" style="background:${r.bg};color:${r.color}">${r.icon}</span><div><b>${r.user}</b><small>${r.name}</small></div></div>
    <nav class="sb-nav">${items}</nav>
    <div class="sb-foot">Contact Financial Holding<br>Digital Factoring · v2</div>`;
}
function renderTopbar(){
  const r=ROLES[state.role];
  const unread=myNotifs().filter(n=>n.unread).length;
  el('topbar').innerHTML=`
    <button class="tb-hb" onclick="toggleSidebar(true)">☰</button>
    <button class="tb-back" onclick="goBack()" title="Back">←</button>
    <div class="crumbs">${crumbsHtml()}</div>
    <div class="tb-spacer"></div>
    <div class="tb-search tb-gsearch"><span>⌕</span><input placeholder="${t('search')}" onkeydown="if(event.key==='Enter')globalSearch(this.value)"></div>
    <div class="lang-toggle"><button class="${state.lang==='en'?'on':''}" onclick="setLang('en')">EN</button><button class="${state.lang==='ar'?'on':''}" onclick="setLang('ar')">ع</button></div>
    <button class="tb-btn" onclick="toggleNotif()" title="${t('notifications')}">🔔${unread?'<span class="ndot"></span>':''}</button>
    <button class="tb-btn" onclick="toggleTheme()" title="Toggle light / dark">${state.theme==='dark'?'☀️':'🌙'}</button>
    <button class="tb-btn" onclick="go('settings')" title="Settings">⚙️</button>
    <div class="user-chip" onclick="togglePmenu(event)"><div class="av">${initials(r.user)}</div><div><b>${r.user.length>16?r.user.slice(0,15)+'…':r.user}</b><small>${r.name}</small></div><span class="cv">▾</span>${profileMenu()}</div>`;
}
function profileMenu(){
  const r=ROLES[state.role];
  return `<div class="pmenu ${state.pmenuOpen?'open':''}" onclick="event.stopPropagation()">
    <div class="ph"><div class="pav">${initials(r.user)}</div><div><b>${r.user}</b><small>${r.name}</small></div></div>
    <div class="pbody">
      <div class="pr"><span class="k">Company</span><span class="v">${r.company}</span></div>
      <div class="pr"><span class="k">User type</span><span class="v">${r.name}</span></div>
      <div class="pr"><span class="k">Mobile</span><span class="v mono">${r.mobile}</span></div>
      <div class="pr"><span class="k">Email</span><span class="v">${r.email}</span></div>
      <div class="pr"><span class="k">Status</span><span class="v"><span class="badge-st settled"><i class="bd"></i>Active</span></span></div>
      <div class="pr"><span class="k">Last login</span><span class="v">${r.last}</span></div>
    </div>
    <div class="pacts">
      <button onclick="go('settings')">⚙️ Settings & notification preferences</button>
      <button onclick="go('notifications')">🔔 Notifications</button>
      <button class="danger" onclick="logout()">⏏ Logout</button>
    </div></div>`;
}
function togglePmenu(e){ e.stopPropagation(); state.pmenuOpen=!state.pmenuOpen; renderTopbar(); }
document.addEventListener('click',()=>{ if(state.pmenuOpen){ state.pmenuOpen=false; if(el('topbar'))renderTopbar(); } });

/* breadcrumbs */
function crumbsHtml(){
  const trail=crumbsFor(); 
  return trail.map((c,i)=>{ const last=i===trail.length-1;
    return (last?`<b>${c.label}</b>`:`<a onclick="${c.go||''}">${c.label}</a>`)+(last?'':`<span class="sep">/</span>`);
  }).join('');
}
function crumbsFor(){
  const v=state.view, p=state.param;
  const home={label:t('home'), go:"go('dashboard')"};
  const M={
    dashboard:[{label:'Dashboard'}],
    buyers:[home,{label:'Buyer Management'}],
    'buyer-detail':[home,{label:'Buyers',go:"go('buyers')"},{label:(findBuyer(p)||{}).short||'Profile'}],
    'buyer-new':[home,{label:'Buyers',go:"go('buyers')"},{label:'New Buyer'}],
    suppliers:[home,{label:'Supplier Management'}],
    'supplier-detail':[home,{label:'Suppliers',go:"go('suppliers')"},{label:(findSupplier(p)||{}).short||'Profile'}],
    'supplier-new':[home,{label:'Suppliers',go:"go('suppliers')"},{label:'New Supplier'}],
    'supplier-linking':[home,{label:'Supplier Linking'}],
    limits:[home,{label:'Limit Management'}],
    'limit-detail':[home,{label:'Limit Management',go:"go('limits')"},{label:(findBuyer(p)||{}).short||'Buyer'}],
    factoring:[home,{label:'Factoring Overview'}],
    invoices:[home,{label:'Invoice Management'}],
    'invoice-new':[home,{label:'Invoices',go:"go('invoices')"},{label:'Single Upload'}],
    'invoice-bulk':[home,{label:'Invoices',go:"go('invoices')"},{label:'Bulk Upload'}],
    case:[home,{label:'Invoices',go:"go('invoices')"},{label:(findCase(p)||{}).invoiceNo||'Request'}],
    'pending-validation':[home,{label:'Pending Validation'}],
    'fra-queue':[home,{label:'FRA Validation'}],
    'deviation-queue':[home,{label:'Deviation Committee'}],
    'deviation-detail':[home,{label:'Deviation Committee',go:"go('deviation-queue')"},{label:'Exceedance Decision'}],
    'profile-approvals':[home,{label:'Profile Approvals'}],
    'profile-approval-detail':[home,{label:'Profile Approvals',go:"go('profile-approvals')"},{label:'Review'}],
    'credit-queue':[home,{label:'Execution Validation'}],
    approvals:[home,{label:'Approvals'}],
    'finance-queue':[home,{label:'Funding & Settlement'}],
    settlements:[home,{label:'Settlement Tracking'}],
    financing:[home,{label:'Financing'}],
    'escrow-ack':[home,{label:'Escrow Acknowledgements'}],
    documents:[home,{label:'Documents'}],
    users:[home,{label:'User Management'}],
    permissions:[home,{label:'Roles & Permissions'}],
    sitemap:[home,{label:'Information Architecture'}],
    workflow:[home,{label:'Workflow Visualization'}],
    audit:[home,{label:'Audit Logs'}],
    reports:[home,{label:'Reports'}],
    notifications:[home,{label:'Notifications'}],
    settings:[home,{label:'Settings'}],
  };
  return M[v]||[{label:'Dashboard'}];
}
function setLang(l){ state.lang=l; document.documentElement.dir=l==='ar'?'rtl':'ltr'; document.documentElement.lang=l; renderShell(); toast(l==='ar'?'تم التبديل إلى العربية':'Switched to English','ok','🌐'); }
function applyTheme(){ document.documentElement.setAttribute('data-theme', state.theme); try{localStorage.setItem('cf.theme',state.theme);}catch(e){} }
function toggleTheme(){ state.theme = state.theme==='dark'?'light':'dark'; applyTheme(); if(el('topbar')&&el('app').style.display!=='none') renderTopbar(); toast(state.theme==='dark'?'Dark mode on':'Light mode on','brand',state.theme==='dark'?'🌙':'☀️'); }
function switchRole(r){ state.role=r; state.view='dashboard'; state.param=null; state.tab=null; state.hist=[]; state.notifOpen=false; el('notifPanel').classList.remove('open'); if(r==='buyer'){const b=myBuyer();ROLES.buyer.user=b.name;ROLES.buyer.company=b.name;} if(r==='supplier'){const s=mySupplier();ROLES.supplier.user=s.name;ROLES.supplier.company=s.name;} renderShell(); toast('Now viewing as '+ROLES[r].name,'brand','👁'); }
function toggleSidebar(open){ el('sidebar').classList.toggle('open',open); el('sbBackdrop').classList.toggle('open',open); }
function go(v,param){ if(state.view&&state.view!==v){ (state.hist=state.hist||[]).push({view:state.view,param:state.param,tab:state.tab}); if(state.hist.length>30)state.hist.shift(); } state.view=v; state.param=param||null; state.tab=null; state.pmenuOpen=false; toggleSidebar(false); renderSidebar(); renderTopbar(); route(); window.scrollTo(0,0); }
function goBack(){ const h=state.hist||[]; if(h.length){ const prev=h.pop(); state.view=prev.view; state.param=prev.param; state.tab=prev.tab; state.pmenuOpen=false; renderSidebar(); renderTopbar(); route(); window.scrollTo(0,0); } else { go('dashboard'); } }
function openCase(id){ go('case',id); }
function quickSearch(q){ if(!q)return; const c=cases.find(x=>x.invoiceNo.toLowerCase().includes(q.toLowerCase())||x.ref.toLowerCase().includes(q.toLowerCase())); if(c)openCase(c.id); else toast('No match for "'+q+'"','warn','⌕'); }
function globalSearch(q){ q=(q||'').trim(); state.pmenuOpen=false; if(!q){ return; } state.searchQ=q; go('search'); }


/* ============================================================
   PART 3 — ROUTER · DASHBOARDS · VIEWS
   ============================================================ */
function route(){
  const C=el('content'); let html='';
  switch(state.view){
    case 'dashboard': html=viewDashboard(); break;
    case 'buyers': html=viewBuyers(); break;
    case 'buyer-detail': html=viewBuyerDetail(); break;
    case 'buyer-new': html=viewProfileForm('buyer'); break;
    case 'suppliers': html=viewSuppliers(); break;
    case 'supplier-detail': html=viewSupplierDetail(); break;
    case 'supplier-new': html=viewProfileForm('supplier'); break;
    case 'supplier-linking': html=viewSupplierLinking(); break;
    case 'limits': html=viewLimits(); break;
    case 'limit-detail': html=viewLimitDetail(); break;
    case 'factoring': html=viewFactoring(); break;
    case 'invoices': html=viewInvoices(); break;
    case 'invoice-new': html=viewInvoiceNew(); break;
    case 'invoice-bulk': html=viewInvoiceBulk(); break;
    case 'case': html=viewCase(); break;
    case 'pending-validation': html=viewPendingValidation(); break;
    case 'fra-queue': html=viewFRA(); break;
    case 'deviation-queue': html=viewDeviation(); break;
    case 'deviation-detail': html=viewDeviationDetail(); break;
    case 'profile-approvals': html=viewProfileApprovals(); break;
    case 'profile-approval-detail': html=viewProfileApprovalDetail(); break;
    case 'credit-queue': html=viewCredit(); break;
    case 'approvals': html=viewApprovals(); break;
    case 'finance-queue': html=viewFinance(); break;
    case 'settlements': html=viewSettlements(); break;
    case 'financing': html=viewFinancing(); break;
    case 'escrow-ack': html=viewEscrowAck(); break;
    case 'documents': html=viewDocuments(); break;
    case 'users': html=viewUsers(); break;
    case 'permissions': html=viewPermissions(); break;
    case 'sitemap': html=viewSitemap(); break;
    case 'workflow': html=viewWorkflow(); break;
    case 'audit': html=viewAudit(); break;
    case 'reports': html=viewReports(); break;
    case 'notifications': html=viewNotifications(); break;
    case 'settings': html=viewSettings(); break;
    case 'search': html=viewSearch(); break;
    default: html=emptyState('Coming soon','This screen is part of a later build phase.','🚧');
  }
  C.innerHTML='<div class="view-anim">'+html+'</div>';
}

/* white-label banner (buyer branding) */
function wlBanner(){
  const b=myBuyer();
  return `<div class="wl-banner" style="background:linear-gradient(110deg,${b.brand},${shade(b.brand,-22)})">
    <div class="wl-logo">${initials(b.name)}</div>
    <div><b>${b.name}</b><small>White-labelled supply-chain finance portal · powered by Contact Factoring</small></div>
    <div style="margin-inline-start:auto;text-align:end"><div class="t-strong" style="color:#fff;font-size:13px">${b.terms} · buffer ${b.buffer}</div><small style="opacity:.85">CR ${b.cr}</small></div>
  </div>`;
}
function shade(hex,p){ const n=parseInt(hex.slice(1),16); let r=(n>>16)&255,g=(n>>8)&255,b=n&255; r=Math.max(0,Math.min(255,r+p));g=Math.max(0,Math.min(255,g+p));b=Math.max(0,Math.min(255,b+p)); return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1); }

function viewDashboard(){
  switch(state.role){
    case 'rm': return dashRM();
    case 'buyer': return dashBuyer();
    case 'supplier': return dashSupplier();
    case 'credit': return dashCredit();
    case 'legal': return dashLegal();
    case 'fra': return dashFRA();
    case 'deviation': return dashDeviation();
    case 'finance': return dashFinance();
    case 'admin': return dashAdmin();
  }
}
function greet(name){ return `${t('greeting')}, ${name.split(' ')[0]}`; }
function attentionList(items){
  return items.map(it=>`<div class="doc" style="cursor:pointer" onclick="go('${it.v}')">
    <div class="di" style="background:${STAGE[it.s]?'var(--st-'+STAGE[it.s].cls+'-bg)':'var(--surface-2)'}">${it.s==='fra'?'🛡️':it.s==='pendingbuyer'?'⏳':it.s==='deviation'?'⚖️':'✓'}</div>
    <div><b style="font-size:13px">${it.t}</b></div><div class="da"><button class="btn btn-sm btn-quiet">Open →</button></div></div>`).join('');
}
function quickCard(ic,title,sub,v){ return `<button class="sm-node" style="text-align:left;cursor:pointer;border:none" onclick="go('${v}')"><h4>${ic} ${title}</h4><p style="color:var(--muted);font-size:12.5px;margin:0">${sub}</p></button>`; }

function dashRM(){
  const inflight=cases.filter(c=>!['settled','closed','rejected'].includes(c.stage));
  const totalLimit=BUYERS.reduce((a,b)=>a+b.limit,0), used=BUYERS.reduce((a,b)=>a+b.used,0);
  const pendApprovals=cases.filter(c=>['submitted','pendingbuyer'].includes(c.stage)).length;
  const underReview=cases.filter(c=>['fra','deviation','credit'].includes(c.stage)).length;
  const funded=cases.filter(c=>['funded','settled','closed'].includes(c.stage));
  return pageHead('Relationship Manager', greet(ROLES.rm.user), 'Onboarding, limits and case routing across reverse and recourse factoring.',
      `<button class="btn btn-ghost" onclick="go('buyer-new')">＋ New Buyer</button><button class="btn btn-primary" onclick="go('invoice-new')">＋ New Request</button>`)
    + `<div class="grid cols-4">
        ${stat('Total customers', BUYERS.length+SUPPLIERS.length, '👥','#E7E7F6','#34349A',BUYERS.length+' buyers · '+SUPPLIERS.length+' suppliers','flat')}
        ${stat('Active buyers', BUYERS.filter(b=>b.status==='active').length, '🏢','#E4ECF8','#1B4DA1','+1 this month','up')}
        ${stat('Active suppliers', SUPPLIERS.filter(s=>s.status==='active').length, '📦','#E6F3EB','#15803D','all live','flat')}
        ${stat('Outstanding limits', egpC(used), '📐','#FEF1E0','#B5651A',Math.round(used/totalLimit*100)+'% utilised','flat')}
      </div>`
    + `<div class="grid cols-4" style="margin-top:16px">
        ${stat('Pending approvals', pendApprovals, '✓','#E7EFFE','#2563EB','need routing','down')}
        ${stat('Invoices under review', underReview, '🔎','#ECEBFB','#4F46E5','FRA · committee · credit','flat')}
        ${stat('Funded amount', egpC(funded.reduce((a,c)=>a+c.amount,0)), '🏦','#F4E8FC','#9333EA',funded.length+' invoices','up')}
        ${stat('Alerts', BUYERS.filter(b=>b.limit-b.used<b.limit*0.1).length+cases.filter(c=>c.flagConc).length, '⚠️','#FBEAE8','#B42318','limit & concentration','down')}
      </div>`
    + `<div class="grid cols-2" style="margin-top:16px">
        <div class="card"><div class="card-h"><h3>Needs your attention</h3><div class="ch-act"><button class="btn btn-sm btn-quiet" onclick="go('approvals')">All approvals →</button></div></div>
          <div class="card-pad">${attentionList([
            {t:'2 supplier invoices awaiting buyer validation', s:'pendingbuyer', v:'approvals'},
            {t:'1 request in FRA validation', s:'fra', v:'fra-queue'},
            {t:'2 concentration reviews at Deviation Committee', s:'deviation', v:'limits'},
          ])}</div></div>
        <div class="card"><div class="card-h"><h3>Recent notifications</h3><div class="ch-act"><button class="btn btn-sm btn-quiet" onclick="go('notifications')">View all →</button></div></div>
          <div class="card-pad">${myNotifs().slice(0,3).map(n=>`<div class="notif"><div class="nic" style="background:${n.bg};color:${n.col}">${n.icon}</div><div><b style="font-size:13px">${n.title}</b><p style="margin:2px 0 0;font-size:12px;color:var(--ink-soft)">${n.body}</p></div></div>`).join('')}</div></div>
      </div>`
    + `<div class="section-title">In-flight requests</div>` + caseTable(inflight.slice(0,6));
}

function dashBuyer(){
  const me=myBuyer(); const mine=cases.filter(c=>c.buyerId===me.id); const pend=pendingForBuyer();
  return pageHead('Buyer Portal', greet(me.name), 'Your approved supply-chain finance facility, invoices and settlements.',
      `<button class="btn btn-primary" onclick="go('invoice-new')">＋ Upload Invoice</button>`)
    + wlBanner()
    + (pend.length?`<div class="alert warn" style="margin-bottom:16px"><span class="ai">⏳</span><div><b>${pend.length} supplier invoice(s) awaiting your validation.</b> Confirm goods received, no dispute, and commitment to pay on maturity. <a style="text-decoration:underline;cursor:pointer" onclick="go('pending-validation')">Review now →</a></div></div>`:'')
    + `<div class="grid cols-4">
        ${stat('Approved limit', egpC(me.limit), '📐','#E7E7F6','#34349A')}
        ${stat('Utilised', Math.round(me.used/me.limit*100)+'%', '⇄','#E4ECF8','#1B4DA1',egp(me.used),'flat')}
        ${stat('Available headroom', egpC(me.limit-me.used), '✓','#E6F3EB','#15803D')}
        ${stat('Pending validation', pend.length, '⏳','#FCEDE2','#C2410C',pend.length?'action needed':'all clear',pend.length?'down':'flat')}
      </div>`
    + `<div class="grid cols-2" style="margin-top:16px">
        <div class="card card-pad"><h3 style="font-size:14.5px;margin-bottom:12px">Facility overview</h3>
          <div class="kv">
            <div class="row"><span class="k">Commercial Register</span><span class="v mono">${me.cr}</span></div>
            <div class="row"><span class="k">Payment terms</span><span class="v">${me.terms} · buffer ${me.buffer}</span></div>
            <div class="row"><span class="k">Finance rate</span><span class="v">${me.rate}</span></div>
            <div class="row"><span class="k">Linked suppliers</span><span class="v">${me.suppliers.length}</span></div>
            <div class="row"><span class="k">Settlement bank</span><span class="v mono">${me.bank}</span></div>
          </div></div>
        <div class="card"><div class="card-h"><h3>Linked suppliers</h3><div class="ch-act"><button class="btn btn-sm btn-quiet" onclick="go('limits')">Limits →</button></div></div><div class="card-pad">
          ${me.suppliers.map(findSupplier).filter(Boolean).map(s=>`<div class="doc"><div class="di" style="${avatarStyle(s.name)}">${initials(s.name)}</div><div><b>${s.name}</b><small>${s.cr} · ${s.terms}</small></div><div class="da"><span class="tag">${egp(s.used)} used</span></div></div>`).join('')}
        </div></div>
      </div>`
    + `<div class="section-title">Your invoices</div>` + caseTable(mine.slice(0,6));
}

function dashSupplier(){
  const me=mySupplier(); const mine=cases.filter(c=>c.supplierId===me.id);
  const funded=mine.filter(c=>['funded','settled','closed'].includes(c.stage)); const ackP=escrowPending();
  return pageHead('Supplier Portal', greet(me.name), me.model==='normal'?'Recourse factoring — you are Contact\'s client and obligor.':'Reverse factoring — early payment against your buyer\'s approved limit.',
      `<button class="btn btn-primary" onclick="go('invoice-new')">＋ Upload Invoice</button>`)
    + (me.model==='normal'?`<div class="alert danger" style="margin-bottom:16px"><span class="ai">⚠️</span><div><b>Full recourse facility.</b> On buyer non-payment at maturity, Contact retains recourse to your account.</div></div>`:'')
    + (ackP.length?`<div class="alert" style="background:var(--st-deviation-bg);color:var(--st-deviation);margin-bottom:16px"><span class="ai">🔐</span><div><b>${ackP.length} silent-factoring acknowledgement(s) required.</b> Confirm collection only via Contact's escrow account. <a style="text-decoration:underline;cursor:pointer" onclick="go('escrow-ack')">Acknowledge →</a></div></div>`:'')
    + `<div class="grid cols-4">
        ${stat('Facility limit', egpC(me.limit), '📐','#E7E7F6','#34349A')}
        ${stat('Financed YTD', egpC(funded.reduce((a,c)=>a+c.amount,0)), '🏦','#F4E8FC','#9333EA',funded.length+' invoices','up')}
        ${stat('In progress', mine.filter(c=>!['settled','closed','rejected','funded'].includes(c.stage)).length, '⇄','#E4ECF8','#1B4DA1','being processed','flat')}
        ${stat('Available headroom', egpC(me.limit-me.used), '✓','#E6F3EB','#15803D')}
      </div>`
    + `<div class="grid cols-3" style="margin-top:16px">
        <div class="card card-pad" style="grid-column:span 2"><h3 style="font-size:14.5px;margin-bottom:6px">Latest SWIFT confirmation</h3>${funded.length?swiftBlock(funded[0]):'<p class="t-sub">No disbursements yet.</p>'}</div>
        <div class="card card-pad"><h3 style="font-size:14.5px;margin-bottom:12px">Relationship</h3>
          <div class="kv"><div class="row"><span class="k">Trading since</span><span class="v">${me.since}</span></div>
          <div class="row"><span class="k">Concentration cap</span><span class="v">${me.conc}</span></div>
          <div class="row"><span class="k">Finance rate</span><span class="v">${me.rate}</span></div></div></div>
      </div>`
    + `<div class="section-title">My invoices</div>` + caseTable(mine.slice(0,6));
}
function swiftBlock(c){
  return `<div style="border:1px solid var(--line);border-radius:var(--r-sm);padding:14px;background:var(--surface);font-family:var(--font-mono);font-size:12px;line-height:1.7">
    <div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">MT103 · INSTANT SWIFT</span><span class="badge-st funded"><i class="bd"></i>FUNDED</span></div>
    <div>REF&nbsp;&nbsp;&nbsp;: ${c.ref}</div><div>INV&nbsp;&nbsp;&nbsp;: ${c.invoiceNo}</div>
    <div>AMT&nbsp;&nbsp;&nbsp;: ${egp(c.amount)}</div><div>VALUE&nbsp;: ${c.issue}</div>
    <div>BEN&nbsp;&nbsp;&nbsp;: ${c.supplier}</div><div>STATUS: ADVANCE DISBURSED ✓</div></div>`;
}
function dashCredit(){
  const q=cases.filter(c=>c.stage==='credit');
  return pageHead('Credit Team', greet(ROLES.credit.user), 'Review created profiles (credit), validate execution of financing requests, approve or reject.')
    + `<div class="grid cols-4">
      ${stat('Profiles to review', countProfile('credit'), '📝','#FBEEDD','#92400E','credit sign-off','flat')}
      ${stat('Execution validations', q.length, '📊','#E1F2F6','#0E7490','SLA 24h','flat')}
      ${stat('Approved this week', cases.filter(c=>['approved','funded','settled','closed'].includes(c.stage)).length, '✓','#E3F4EC','#0B6E4F','+3','up')}
      ${stat('Exceedances', cases.filter(c=>c.flagConc).length, '⚠️','#FBEAE8','#B42318','at committee','down')}
    </div>`
    + (countProfile('credit')?`<div class="section-title">Profiles awaiting credit review</div>`+profileApprovalTable(paQueueFor('credit')):'')
    + `<div class="section-title">Execution validation queue</div>`
    + caseTable(q,{actions:c=>`<button class="btn btn-sm btn-primary" onclick="openCase('${c.id}')">Assess</button>`, emptyTitle:'Queue clear', emptyBody:'No applications awaiting execution validation.', emptyIcon:'✓'});
}
function dashLegal(){
  const q=paQueueFor('legal');
  return pageHead('Legal Team', greet(ROLES.legal.user), 'Legal review of created buyer & supplier profiles — contracts, recourse and escrow clauses, KYC. Approve, reject or request documents.')
    + `<div class="grid cols-3">
      ${stat('Profiles to review', q.length, '⚖️','#FBEEDD','#92400E','legal sign-off','flat')}
      ${stat('Credit-cleared, awaiting legal', PROFILE_APPROVALS.filter(p=>p.credit.status==='approved'&&p.legal.status==='pending').length, '📝','#E1F2F6','#0E7490')}
      ${stat('Active this quarter', PROFILE_APPROVALS.filter(p=>paOverall(p).l==='Active').length, '✓','#E3F4EC','#0B6E4F','onboarded','up')}
    </div>`
    + `<div class="section-title">Profiles awaiting legal review</div>`
    + profileApprovalTable(q);
}
function profileApprovalTable(list){
  if(!list||!list.length) return emptyState('Nothing to review','No profiles are awaiting your sign-off.','✓');
  const teamCol=p=>{ const t=(s)=>`<span class="badge-st ${s.status==='approved'?'approved':s.status==='returned'?'rejected':s.status==='modified'?'submitted':s.status==='pending'?'credit':'fra'}"><i class="bd"></i>${s.status==='waiting'?'Waiting':s.status.charAt(0).toUpperCase()+s.status.slice(1)}</span>`;
    return t; };
  const T=teamCol();
  return `<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Profile</th><th>Type</th><th>Submitted by</th><th>Credit</th><th>Legal</th><th>Missing docs</th><th></th></tr></thead><tbody>
    ${list.map(p=>{ const missing=p.docs.filter(d=>!d.ok).length;
      return `<tr class="row-link" onclick="go('profile-approval-detail','${p.id}')"><td>${party(p.name, p.cr)}</td><td><span class="tag ${p.kind==='buyer'?'reverse':'normal'}">${p.kind}</span></td><td class="t-sub">${p.submittedBy}<div class="t-sub mono">${p.submittedOn}</div></td><td>${T(p.credit)}</td><td>${T(p.legal)}</td><td>${missing?`<span class="badge-st rejected"><i class="bd"></i>${missing} missing</span>`:'<span class="t-sub">—</span>'}</td><td>${(state.role==='rm'||state.role==='admin')&&(p.credit.status==='returned'||p.legal.status==='returned')?`<button class="btn btn-sm btn-primary" onclick="event.stopPropagation();paResubmit('${p.id}')">🔁 Resubmit</button>`:`<button class="btn btn-sm btn-primary" onclick="event.stopPropagation();go('profile-approval-detail','${p.id}')">Review</button>`}</td></tr>`;
    }).join('')}
  </tbody></table></div></div>`;
}
function viewProfileApprovals(){
  const team = state.role==='legal'?'legal':state.role==='credit'?'credit':null;
  const sub = state.role==='rm'
    ? 'Track the credit and legal sign-off of every profile you created. Returned profiles need your correction and re-submission.'
    : 'Review created buyer & supplier profiles. Approve, reject (return to RM), comment to the RM, and flag missing documents.';
  const list = team ? PROFILE_APPROVALS.filter(p=>p[team]) : PROFILE_APPROVALS;
  return pageHead(ROLES[state.role].name, 'Profile Approvals', sub)
    + `<div class="alert info" style="margin-bottom:16px"><span class="ai">🔄</span><div><b>Approval cycle.</b> RM creates a profile → <b>Credit</b> review → <b>Legal</b> review → <b>Active</b>. Either team can return it to the RM with comments and a list of missing documents.</div></div>`
    + profileApprovalTable(list);
}
function viewProfileApprovalDetail(){
  const p=PROFILE_APPROVALS.find(x=>x.id===state.param); if(!p) return emptyState('Profile not found','','📝');
  const role=state.role; const canCredit = role==='credit'&&(p.credit.status==='pending'||p.credit.status==='modified'); const canLegal = role==='legal'&&(p.legal.status==='pending'||p.legal.status==='modified');
  const ov=paOverall(p);
  const teamCard=(label,s)=>`<div class="kv"><div class="row"><span class="k">${label} status</span><span class="v"><span class="badge-st ${s.status==='approved'?'approved':s.status==='returned'?'rejected':s.status==='modified'?'submitted':s.status==='pending'?'credit':'fra'}"><i class="bd"></i>${s.status==='waiting'?'Waiting for credit':s.status.charAt(0).toUpperCase()+s.status.slice(1)}</span></span></div>${s.by?`<div class="row"><span class="k">Decided by</span><span class="v">${s.by} · ${s.on}</span></div>`:''}${s.note?`<div class="row"><span class="k">Note</span><span class="v">${s.note}</span></div>`:''}</div>`;
  return pageHead('Profile Approvals', p.name, p.kind.charAt(0).toUpperCase()+p.kind.slice(1)+' profile · '+p.cr+' · submitted by '+p.submittedBy,
      `<button class="btn btn-ghost" onclick="go('profile-approvals')">← Queue</button> <span class="badge-st ${ov.c}" style="align-self:center"><i class="bd"></i>${ov.l}</span>`)
    + `<div class="detail-grid">
      <div>
        <div class="card card-pad" style="margin-bottom:16px"><h3 style="font-size:14.5px;margin-bottom:12px">Required documents</h3>
          ${p.docs.map((d,i)=>`<div class="doc"><div class="di" style="background:${d.ok?'var(--st-settled-bg)':'var(--st-rejected-bg)'}">${d.ok?'✓':'!'}</div><div><b>${d.n}</b><small>${d.ok?'Provided':'Missing / not acceptable'}</small></div><div class="da">${(canCredit||canLegal)?`<button class="btn btn-sm btn-quiet" onclick="paToggleDoc('${p.id}',${i})">${d.ok?'Flag missing':'Mark received'}</button>`:(d.ok?'<button class="btn btn-sm btn-quiet">View</button>':'<span class="t-sub">requested</span>')}</div></div>`).join('')}
        </div>
        <div class="card card-pad"><h3 style="font-size:14.5px;margin-bottom:10px">Comments to RM</h3>
          <div class="timeline" style="margin-bottom:12px">${p.comments.length?p.comments.map(cm=>`<div class="tl-item"><div class="tl-dot"></div><b>${cm.by}</b><div class="tl-meta">${cm.on}</div><p>${cm.text}</p></div>`).join(''):'<div class="t-sub" style="padding:4px 0">No comments yet.</div>'}</div>
          ${(canCredit||canLegal)?`<div class="fld full"><label>Add a comment for the RM</label><textarea id="paComment" rows="2" placeholder="Explain a missing document or a required correction…"></textarea></div><button class="btn btn-quiet btn-sm" onclick="paAddComment('${p.id}')">＋ Add comment</button>`:''}
        </div>
      </div>
      <div>
        <div class="card card-pad"><h3 style="font-size:13px;margin-bottom:10px">Decision</h3>
          ${teamCard('Credit', p.credit)}
          <div style="height:10px"></div>
          ${teamCard('Legal', p.legal)}
          ${canCredit||canLegal?`<div style="margin-top:14px;border-top:1px solid var(--line);padding-top:14px">
            <button class="btn btn-primary btn-block" style="margin-bottom:8px" onclick="paDecide('${p.id}','${role}','approve')">✓ Approve (${ROLES[role].short})</button>
            <button class="btn btn-danger btn-block" onclick="paDecide('${p.id}','${role}','return')">↩ Return to RM</button>
            <div class="t-sub" style="margin-top:8px;font-size:11.5px">${role==='credit'?'Approving routes the profile to Legal review.':'Approving activates the profile on the portal.'}</div>
          </div>`:((role==='rm'||role==='admin')&&(p.credit.status==='returned'||p.legal.status==='returned')?`<div style="margin-top:14px;border-top:1px solid var(--line);padding-top:14px"><button class="btn btn-primary btn-block" onclick="paResubmit('${p.id}')">🔁 Update & resubmit (Modified)</button><div class="t-sub" style="margin-top:8px;font-size:11.5px">Provides the missing documents and returns the profile to the review queue as “Modified”.</div></div>`:`<div class="alert info" style="margin-top:12px;font-size:12px"><span class="ai">👁</span><div>${role==='rm'?'View-only. Address any comments/missing documents, then re-submit.':'View-only for your role.'}</div></div>`)}
        </div>
        <div class="card card-pad" style="margin-top:16px"><h3 style="font-size:13px;margin-bottom:8px">Profile summary</h3>
          <div class="kv"><div class="row"><span class="k">Entity</span><span class="v">${p.name}</span></div><div class="row"><span class="k">CR</span><span class="v mono">${p.cr}</span></div><div class="row"><span class="k">Type</span><span class="v">${p.kind}</span></div><div class="row"><span class="k">Submitted</span><span class="v">${p.submittedOn}</span></div></div>
        </div>
      </div>
    </div>`;
}
function paToggleDoc(id,i){ const p=PROFILE_APPROVALS.find(x=>x.id===id); if(!p)return; p.docs[i].ok=!p.docs[i].ok; toast(p.docs[i].ok?'Marked received':'Flagged as missing', p.docs[i].ok?'ok':'warn', p.docs[i].ok?'✓':'⚠️'); route(); }
function paAddComment(id){ const p=PROFILE_APPROVALS.find(x=>x.id===id); if(!p)return; const v=el('paComment')&&el('paComment').value.trim(); if(!v){toast('Write a comment first','warn','✍️');return;} p.comments.push({by:ROLES[state.role].user+' ('+ROLES[state.role].short+')', on:'2026-06-14', text:v}); toast('Comment sent to RM','ok','💬'); route(); }
function paDecide(id,team,action){ const p=PROFILE_APPROVALS.find(x=>x.id===id); if(!p)return;
  const missing=p.docs.filter(d=>!d.ok).length;
  if(action==='approve'&&missing){ toast(missing+' document(s) still missing — flag resolved or comment first','warn','⚠️'); return; }
  if(action==='approve'){ p[team]={status:'approved', by:ROLES[team].user, on:'2026-06-14', note:p[team].note||'Approved.'};
    if(team==='credit'){ if(p.legal.status!=='approved') p.legal.status='pending'; toast('Credit approved — routed to Legal review','ok','✓'); }
    else { toast('Legal approved — profile is now Active','ok','✓'); }
  } else {
    p[team]={status:'returned', by:ROLES[team].user, on:'2026-06-14', note:p[team].note||'Returned to RM for correction.'};
    if(!p.comments.length) p.comments.push({by:ROLES[team].user+' ('+ROLES[team].short+')',on:'2026-06-14',text:'Returned for correction — please address the missing documents.'});
    toast('Returned to RM for correction','err','↩');
  }
  renderSidebar(); route();
}
function dashFRA(){
  const q=cases.filter(c=>c.stage==='fra');
  return pageHead('FRA Validation Team', greet(ROLES.fra.user), 'Internal e-invoice validation against the FRA system. Not visible to buyers or suppliers.')
    + `<div class="alert brand" style="margin-bottom:16px"><span class="ai">🛡️</span><div><b>Internal process only.</b> Integrates with the FRA e-invoice system in future; runs as a manual validation step with full audit trail for now.</div></div>`
    + `<div class="grid cols-3">
      ${stat('Pending validation', q.length, '🛡️','#ECEBFB','#4F46E5','action needed','flat')}
      ${stat('Validated today', 4, '✓','#E3F4EC','#0B6E4F','+4','up')}
      ${stat('Failed / returned', 1, '✕','#FBEAE8','#B42318','1 invalid','down')}
    </div>`
    + `<div class="section-title">FRA validation queue</div>`
    + caseTable(q,{actions:c=>`<button class="btn btn-sm btn-primary" onclick="openCase('${c.id}')">Validate</button>`, emptyTitle:'Nothing to validate', emptyBody:'All uploaded invoices cleared FRA validation.', emptyIcon:'🛡️'});
}
function dashDeviation(){
  const q=cases.filter(c=>c.stage==='deviation');
  return pageHead('Deviation Committee', greet(ROLES.deviation.user), 'Decide on limit, concentration and global-limit exceedances — override (proceed) or reject.')
    + `<div class="grid cols-3">
      ${stat('Exceedances pending', q.length, '⚖️','#F1E9FD','#7C3AED','awaiting decision','flat')}
      ${stat('Obligors affected', new Set(q.map(c=>c.type==='normal'?c.supplierId:c.buyerId)).size, '🏢','#E4ECF8','#1B4DA1')}
      ${stat('Overrides this quarter', 6, '✓','#E3F4EC','#0B6E4F','approved deviations','up')}
    </div>`
    + `<div class="section-title">Limit / concentration exceedance queue</div>`
    + caseTable(q,{actions:c=>`<button class="btn btn-sm btn-primary" onclick="go('deviation-detail','${c.id}')">Decide</button>`, emptyTitle:'No deviations pending', emptyBody:'No requests have exceeded their limit or concentration.', emptyIcon:'⚖️'});
}
function dashFinance(){
  const fund=cases.filter(c=>c.stage==='approved'), settle=cases.filter(c=>c.stage==='funded');
  return pageHead('Finance Team', greet(ROLES.finance.user), 'Fund approved requests, settle with banks and upload settlement documents.')
    + `<div class="alert info" style="margin-bottom:16px"><span class="ai">🔌</span><div><b>Finance system integration (planned).</b> Documents uploaded in the finance system will appear here automatically. The UI is built API-ready.</div></div>`
    + `<div class="grid cols-4">
      ${stat('Ready to fund', fund.length, '🏦','#E3F4EC','#0B6E4F',egp(fund.reduce((a,c)=>a+c.amount,0)),'flat')}
      ${stat('Funded · to settle', settle.length, '💳','#F4E8FC','#9333EA',egp(settle.reduce((a,c)=>a+c.amount,0)),'flat')}
      ${stat('Settled this month', cases.filter(c=>['settled','closed'].includes(c.stage)).length, '✓','#E6F3EB','#15803D','+5','up')}
      ${stat('SWIFT sent', 12, '📨','#E4ECF8','#1B4DA1','instant','up')}
    </div>`
    + `<div class="section-title">Ready for disbursement</div>`
    + caseTable(fund,{actions:c=>`<button class="btn btn-sm btn-primary" onclick="openCase('${c.id}')">Fund</button>`, emptyTitle:'Nothing to fund', emptyBody:'No approved requests awaiting disbursement.', emptyIcon:'🏦'})
    + `<div class="section-title">Funded — awaiting settlement</div>`
    + caseTable(settle,{actions:c=>`<button class="btn btn-sm btn-gold" onclick="openCase('${c.id}')">Settle</button>`, emptyTitle:'Nothing to settle', emptyBody:'No funded requests awaiting settlement.', emptyIcon:'💳'});
}
function dashAdmin(){
  return pageHead('Administrator', 'System administration', 'Users, permissions, information architecture and audit across the portal.')
    + `<div class="grid cols-4">
      ${stat('Total users', 28, '👤','#EDF1F2','#5A6B72','7 roles','flat')}
      ${stat('Buyers + suppliers', BUYERS.length+SUPPLIERS.length, '🏢','#E4ECF8','#1B4DA1')}
      ${stat('Total requests', cases.length, '🧾','#E7E7F6','#34349A')}
      ${stat('Audit events', cases.reduce((a,c)=>a+c.audit.length,0)+18, '🗂️','#FEF1E0','#B5651A','immutable','flat')}
    </div>`
    + `<div class="grid cols-3" style="margin-top:16px">
      ${quickCard('🗺️','Information Architecture','Sitemap & navigation structure','sitemap')}
      ${quickCard('🔐','Roles & Permissions','Access matrix across 8 roles','permissions')}
      ${quickCard('🔀','Workflow Visualization','End-to-end status pipeline','workflow')}
      ${quickCard('👤','User Management','Provision & manage accounts','users')}
      ${quickCard('📐','Limit Management','Buyer limits & concentration','limits')}
      ${quickCard('🗂️','Audit Logs','Immutable, time-stamped trail','audit')}
    </div>`;
}


/* ============================================================
   PART 3b — CLIENTS & PROFILES
   ============================================================ */
function viewBuyers(){
  const rows=BUYERS.map(b=>{
    const avail=b.limit-b.used, pct=Math.round(b.used/b.limit*100);
    const alert=avail<b.limit*0.1?'warn':(b.flagConc?'conc':'ok');
    return `<tr class="row-link" onclick="go('buyer-detail','${b.id}')">
      <td>${party(b.name,b.cr)}</td>
      <td class="t-amt">${egp(b.limit)}</td>
      <td class="t-amt">${egp(b.used)}</td>
      <td class="t-amt">${egp(avail)}</td>
      <td>${b.suppliers.length} linked</td>
      <td><span class="badge-st ${alert==='warn'?'pendingbuyer':'settled'}"><i class="bd"></i>${alert==='warn'?'Near limit':'Normal'}</span></td>
      <td>${b.status==='active'?'<span class="badge-st settled"><i class="bd"></i>Active</span>':'<span class="badge-st submitted"><i class="bd"></i>Onboarding</span>'}</td>
    </tr>`;}).join('');
  return pageHead('Clients & Profiles', 'Buyer Management', 'Anchor buyers in reverse factoring. RM manages profiles, branding, limits and supplier links.',
      `<button class="btn btn-primary" onclick="go('buyer-new')">＋ New Buyer Profile</button>`)
    + `<div class="toolbar"><div class="chips"><span class="chip on">All buyers</span><span class="chip">Active</span><span class="chip">Onboarding</span><span class="chip">Near limit</span></div><div style="margin-inline-start:auto" class="tb-search"><span>⌕</span><input placeholder="Search buyers…"></div></div>`
    + `<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Buyer</th><th style="text-align:end">Approved Limit</th><th style="text-align:end">Outstanding</th><th style="text-align:end">Available</th><th>Suppliers</th><th>Alert</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function viewBuyerDetail(){
  const b=findBuyer(state.param); if(!b) return emptyState('Buyer not found','','🏢');
  const tab=state.tab||'profile';
  const mine=cases.filter(c=>c.buyerId===b.id);
  const tabs=[{id:'profile',label:'Profile & Branding'},{id:'suppliers',label:'Linked Suppliers'},{id:'limits',label:'Limit'},{id:'invoices',label:'Invoices'}];
  let body='';
  if(tab==='profile'){
    body=`<div class="detail-grid">
      <div class="card card-pad"><h3 style="font-size:14.5px;margin-bottom:12px">Company information</h3>
        <div class="kv">
          <div class="row"><span class="k">Legal name</span><span class="v">${b.name}</span></div>
          <div class="row"><span class="k">Commercial Register</span><span class="v mono">${b.cr}</span></div>
          <div class="row"><span class="k">Email</span><span class="v">${b.email}</span></div>
          <div class="row"><span class="k">Phone</span><span class="v mono">${b.phone}</span></div>
          <div class="row"><span class="k">Payment terms</span><span class="v">${b.terms}</span></div>
          <div class="row"><span class="k">Maturity buffer</span><span class="v">${b.buffer}</span></div>
          <div class="row"><span class="k">Finance rate</span><span class="v">${b.rate}</span></div>
          <div class="row"><span class="k">Settlement bank</span><span class="v mono">${b.bank}</span></div>
        </div></div>
      <div>
        <div class="card card-pad" style="margin-bottom:16px"><h3 style="font-size:14.5px;margin-bottom:12px">Branding & white-labelling</h3>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
            <div style="width:52px;height:52px;border-radius:13px;background:${b.brand};color:#fff;display:grid;place-items:center;font-size:20px;font-weight:800">${initials(b.name)}</div>
            <div><div class="t-strong">${b.name}</div><div class="t-sub">Buyer logo · displayed on buyer login</div></div>
          </div>
          <div class="kv"><div class="row"><span class="k">Brand colour</span><span class="v"><span style="display:inline-flex;align-items:center;gap:7px"><span style="width:14px;height:14px;border-radius:4px;background:${b.brand};display:inline-block"></span><span class="mono">${b.brand}</span></span></span></div></div>
          <div style="margin-top:12px"><button class="btn btn-sm btn-ghost" onclick="toast('Branding editor (prototype)','brand','🎨')">Edit branding</button></div>
          <div class="alert brand" style="margin-top:14px;font-size:12px"><span class="ai">🎨</span><div>When <b>${b.short}</b> signs in, the portal is white-labelled with this logo, name and brand colour throughout.</div></div>
        </div>
        <div class="card card-pad"><h3 style="font-size:14.5px;margin-bottom:10px">Status</h3>
          ${b.status==='active'?'<span class="badge-st settled"><i class="bd"></i>Active facility</span>':'<span class="badge-st submitted"><i class="bd"></i>Onboarding</span>'}
          <div style="margin-top:12px"><button class="btn btn-sm btn-primary" onclick="go('limit-detail','${b.id}')">Open Limit Management →</button></div>
        </div>
      </div></div>`;
  } else if(tab==='suppliers'){
    body=`<div class="card"><div class="card-h"><h3>Linked suppliers</h3><div class="ch-act"><button class="btn btn-sm btn-ghost" onclick="go('supplier-linking')">Manage links</button></div></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Supplier</th><th style="text-align:end">Allocated</th><th style="text-align:end">Utilised</th><th>Concentration</th></tr></thead><tbody>
      ${b.suppliers.map(findSupplier).filter(Boolean).map(s=>`<tr class="row-link" onclick="go('supplier-detail','${s.id}')"><td>${party(s.name,s.cr)}</td><td class="t-amt">${egp(Math.round(s.limit*0.6))}</td><td class="t-amt">${egp(s.used)}</td><td>${s.conc}</td></tr>`).join('')}
      </tbody></table></div></div>`;
  } else if(tab==='limits'){
    body=`<div class="card card-pad">${limitBar(b.name+' — facility utilisation',b.used,b.limit)}
      <div class="grid cols-3" style="margin-top:8px">${stat('Approved',egpC(b.limit),'📐','#E7E7F6','#34349A')}${stat('Outstanding',egpC(b.used),'⇄','#E4ECF8','#1B4DA1')}${stat('Available',egpC(b.limit-b.used),'✓','#E6F3EB','#15803D')}</div>
      <div style="margin-top:14px"><button class="btn btn-primary" onclick="go('limit-detail','${b.id}')">Full Limit Management →</button></div></div>`;
  } else if(tab==='invoices'){
    body=caseTable(mine);
  } else {
    body=auditTimeline([mkAudit('RM · Yara Mansour','Buyer profile created','Onboarded '+b.name), mkAudit('RM · Yara Mansour','Limit assigned',egp(b.limit)+' approved facility'), mkAudit('Credit · Tarek Fouad','Limit endorsed','Risk review passed'), mkAudit('RM · Yara Mansour','Suppliers linked',b.suppliers.length+' suppliers added')]);
  }
  return pageHead('Buyer · '+b.short, b.name, b.cr+' · Reverse factoring anchor',
      `<button class="btn btn-ghost" onclick="go('buyers')">← All buyers</button><button class="btn btn-primary" onclick="go('limit-detail','${b.id}')">Limit Management</button>`)
    + tabBar(tabs) + body;
}
function viewSuppliers(){
  const rows=SUPPLIERS.map(s=>`<tr class="row-link" onclick="go('supplier-detail','${s.id}')">
      <td>${party(s.name,s.cr)}</td>
      <td>${s.buyers.map(id=>(findBuyer(id)||{}).short).filter(Boolean).join(', ')}</td>
      <td class="t-amt">${egp(s.limit)}</td>
      <td class="t-amt">${egp(s.used)}</td>
      <td>${s.conc}</td>
      <td><span class="badge-st settled"><i class="bd"></i>Active</span></td>
    </tr>`).join('');
  return pageHead('Clients & Profiles', 'Supplier Management', 'Suppliers financed under reverse factoring, plus recourse (normal) factoring clients.',
      `<button class="btn btn-primary" onclick="go('supplier-new')">＋ New Supplier Profile</button>`)
    + `<div class="toolbar"><div class="chips"><span class="chip on">All</span><span class="chip">Reverse</span><span class="chip">Normal / recourse</span><span class="chip">Silent</span></div></div>`
    + `<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Supplier</th><th>Linked buyers</th><th style="text-align:end">Limit</th><th style="text-align:end">Utilised</th><th>Concentration</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function viewSupplierDetail(){
  const s=findSupplier(state.param); if(!s) return emptyState('Supplier not found','','📦');
  const tab=state.tab||'profile';
  const mine=cases.filter(c=>c.supplierId===s.id);
  const tabs=[{id:'profile',label:'Profile'},{id:'buyers',label:'Linked Buyers'},{id:'invoices',label:'Invoices'}];
  let body='';
  if(tab==='profile'){
    body=`<div class="detail-grid"><div class="card card-pad"><h3 style="font-size:14.5px;margin-bottom:12px">Company information</h3>
      <div class="kv">
        <div class="row"><span class="k">Legal name</span><span class="v">${s.name}</span></div>
        <div class="row"><span class="k">Commercial Register</span><span class="v mono">${s.cr}</span></div>
        <div class="row"><span class="k">Email</span><span class="v">${s.email}</span></div>
        <div class="row"><span class="k">Phone</span><span class="v mono">${s.phone}</span></div>
        <div class="row"><span class="k">Trading since</span><span class="v">${s.since}</span></div>
        <div class="row"><span class="k">Finance rate</span><span class="v">${s.rate}</span></div>
        <div class="row"><span class="k">Settlement bank</span><span class="v mono">${s.bank}</span></div>
      </div></div>
      <div><div class="card card-pad" style="margin-bottom:16px"><h3 style="font-size:14.5px;margin-bottom:10px">Facility</h3>${limitBar('Utilisation',s.used,s.limit)}
        <div class="kv"><div class="row"><span class="k">Concentration cap</span><span class="v">${s.conc}</span></div><div class="row"><span class="k">Linked buyers</span><span class="v">${s.buyers.length}</span></div></div></div>
        ${s.recourse?`<div class="alert danger" style="font-size:12px"><span class="ai">⚠️</span><div><b>Recourse facility.</b> Contact retains recourse to this supplier on buyer default.</div></div>`:`<div class="alert ok" style="font-size:12px"><span class="ai">✓</span><div>Non-recourse — financing rests on the buyer's approved limit.</div></div>`}
      </div></div>`;
  } else if(tab==='buyers'){
    body=`<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Buyer</th><th style="text-align:end">Buyer limit</th><th>Terms</th><th>Brand</th></tr></thead><tbody>
      ${s.buyers.map(findBuyer).filter(Boolean).map(b=>`<tr class="row-link" onclick="go('buyer-detail','${b.id}')"><td>${party(b.name,b.cr)}</td><td class="t-amt">${egp(b.limit)}</td><td>${b.terms}</td><td><span style="width:14px;height:14px;border-radius:4px;background:${b.brand};display:inline-block;vertical-align:middle"></span></td></tr>`).join('')}
      </tbody></table></div></div>`;
  } else if(tab==='invoices'){ body=caseTable(mine); }
  else { body=auditTimeline([mkAudit('RM · Yara Mansour','Supplier profile created','Onboarded '+s.name), mkAudit('RM · Yara Mansour','Buyers linked',s.buyers.length+' buyers'), mkAudit('Credit · Tarek Fouad','Risk grade assigned','Concentration cap '+s.conc)]); }
  return pageHead('Supplier · '+s.short, s.name, s.cr,
      `<button class="btn btn-ghost" onclick="go('suppliers')">← All suppliers</button><button class="btn btn-primary" onclick="go('supplier-linking')">Linking</button>`)
    + tabBar(tabs) + body;
}
function viewProfileForm(kind){
  const isBuyer=kind==='buyer';
  const brandFields=isBuyer?`
    <div class="fld full"><label>Buyer logo</label><div class="dropzone" style="padding:16px"><div class="dz-ic" style="font-size:20px">🖼️</div>Upload buyer logo (PNG/SVG) — shown on the buyer's white-labelled portal</div></div>
    <div class="fld"><label>Brand colour</label><input type="text" value="#1B4DA1" placeholder="#1B4DA1"></div>
    <div class="fld"><label>Display name (white-label)</label><input type="text" placeholder="e.g. Carrefour Egypt"></div>
    <div class="fld full"><label>Company information (shown to buyer)</label><textarea rows="2" placeholder="Short description displayed on the buyer portal"></textarea></div>`:`
    <div class="fld"><label>Factoring model</label><select><option>Reverse (buyer-led)</option><option>Normal / recourse (supplier client)</option></select></div>
    <div class="fld"><label>Disclosure</label><select><option>Disclosed (NOA to buyer)</option><option>Silent (escrow collection)</option></select></div>`;
  return pageHead(isBuyer?'New Buyer':'New Supplier', isBuyer?'Create buyer profile':'Create supplier profile', isBuyer?'RM onboards the anchor buyer, sets branding, limit and linked suppliers.':'RM onboards the supplier and links predefined buyers.',
      `<button class="btn btn-ghost" onclick="go('${isBuyer?'buyers':'suppliers'}')">Cancel</button>`)
    + `<div class="card card-pad" style="max-width:840px">
      <div class="section-title" style="margin-top:0">Company</div>
      <div class="form-grid">
        ${fld('Legal company name','text','',true)}
        ${fld('Commercial Register (CR)','text','CR-XXXXXX',true)}
        ${fld('Email','email','name@company.eg',true)}
        ${fld('Mobile number','tel','+20 1XX XXX XXXX',true)}
      </div>
      <div class="section-title">${isBuyer?'Facility & branding':'Facility & model'}</div>
      <div class="form-grid">
        ${isBuyer?fld('Approved limit (EGP)','text','50,000,000',true):fld('Requested limit (EGP)','text','',true)}
        ${fld('Payment terms','text','Net 60')}
        ${brandFields}
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px"><button class="btn btn-ghost" onclick="go('${isBuyer?'buyers':'suppliers'}')">Cancel</button><button class="btn btn-primary" onclick="submitProfile('${kind}')">Create ${isBuyer?'buyer':'supplier'}</button></div>
    </div>`;
}
function submitProfile(kind){ toast((kind==='buyer'?'Buyer':'Supplier')+' profile created (prototype)','ok','✓'); go(kind==='buyer'?'buyers':'suppliers'); }
function viewSupplierLinking(){
  return pageHead('Relationships', 'Supplier Linking', 'Link suppliers to buyers. Reverse factoring draws on the buyer\'s approved limit; recourse links the supplier as the financed client.')
    + `<div class="card"><div class="card-h"><h3>Buyer → Supplier matrix</h3></div><div class="tbl-wrap"><table class="matrix"><thead><tr><th>Buyer \\ Supplier</th>${SUPPLIERS.map(s=>`<th>${s.short}</th>`).join('')}</tr></thead><tbody>
      ${BUYERS.map(b=>`<tr><td>${b.short}</td>${SUPPLIERS.map(s=>{const linked=b.suppliers.includes(s.id);return `<td>${linked?'<span class="yes">●</span>':'<span class="no">○</span>'}</td>`}).join('')}</tr>`).join('')}
    </tbody></table></div></div>
    <div class="legend"><span><span class="yes">●</span> Linked</span><span><span class="no">○</span> Not linked</span></div>
    <div style="margin-top:16px"><button class="btn btn-primary" onclick="toast('Link editor (prototype)','brand','🔗')">＋ Create new link</button></div>`;
}


/* ============================================================
   PART 3c — LIMIT MANAGEMENT MODULE (dedicated)
   ============================================================ */
function allocFor(b){
  const sup=b.suppliers.map(findSupplier).filter(Boolean);
  const baseW=[0.40,0.32,0.28,0.20];
  return sup.map((s,i)=>{
    const utilized=cases.filter(c=>c.buyerId===b.id&&c.supplierId===s.id&&!['rejected','draft'].includes(c.stage)).reduce((a,c)=>a+c.amount,0);
    let allocated=Math.round(b.limit*(baseW[i]||0.2)/1e5)*1e5;
    allocated=Math.max(allocated, Math.ceil(utilized/1e5)*1e5);
    return {s, allocated, utilized, remaining:Math.max(0,allocated-utilized), conc:Math.round(allocated/b.limit*100)};
  });
}
function buyerConcStatus(b){ const s=b.concStatus||'Normal'; return s==='High'?{l:'High',c:'rejected'}:s==='Elevated'?{l:'Elevated',c:'pendingbuyer'}:{l:'Normal',c:'settled'}; }
function buyerAlertStatus(b){ const avail=b.limit-b.used; return avail<0?{l:'Breach',c:'rejected'}:avail<b.limit*0.1?{l:'Warning',c:'pendingbuyer'}:{l:'Normal',c:'settled'}; }
function riskTag(conc){ return conc>=40?'<span class="badge-st rejected"><i class="bd"></i>High</span>':conc>=25?'<span class="badge-st pendingbuyer"><i class="bd"></i>Medium</span>':'<span class="badge-st settled"><i class="bd"></i>Low</span>'; }

function viewLimits(){
  // Buyer-scope: a buyer sees only their own limit detail
  if(state.role==='buyer'){ state.param=myBuyer().id; return viewLimitDetail(true); }
  const rows=BUYERS.map(b=>{
    const avail=b.limit-b.used, cs=buyerConcStatus(b), as=buyerAlertStatus(b);
    return `<tr class="row-link" onclick="go('limit-detail','${b.id}')">
      <td>${party(b.name,b.cr)}</td>
      <td class="t-amt">${egp(b.limit)}</td>
      <td class="t-amt">${egp(b.used)}</td>
      <td class="t-amt">${egp(avail)}</td>
      <td><span class="badge-st ${cs.c}"><i class="bd"></i>${cs.l}</span></td>
      <td><span class="badge-st ${as.c}"><i class="bd"></i>${as.l}</span></td>
      <td><button class="btn btn-sm btn-quiet">Open →</button></td>
    </tr>`;}).join('');
  const totalLimit=BUYERS.reduce((a,b)=>a+b.limit,0), totalUsed=BUYERS.reduce((a,b)=>a+b.used,0);
  return pageHead('Limit Management', 'Limit Management', 'Dedicated module for buyer limits, outstanding exposure, available headroom, concentration and alerts.',
      `<button class="btn btn-ghost" onclick="toast('Export (prototype)','brand','📤')">Export</button><button class="btn btn-primary" onclick="toast('New limit request (prototype)','brand','📐')">＋ New Limit</button>`)
    + `<div class="toolbar"><div class="chips"><span class="chip on">All buyers</span><span class="chip">Normal</span><span class="chip">Warning</span><span class="chip">Breach</span></div><div style="margin-inline-start:auto" class="tb-search"><span>⌕</span><input placeholder="Search buyers…"></div></div>`
    + `<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Buyer Name</th><th style="text-align:end">Approved Limit</th><th style="text-align:end">Outstanding</th><th style="text-align:end">Available</th><th>Concentration Status</th><th>Alert Status</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}

function viewLimitDetail(buyerScope){
  const b=findBuyer(state.param); if(!b) return emptyState('Buyer not found','','📐');
  const tab=state.tab||'overview';
  const alloc=allocFor(b); const avail=b.limit-b.used;
  const tabs=[{id:'overview',label:'Overview'},{id:'allocation',label:'Supplier Allocation'},{id:'concentration',label:'Concentration Analysis'},{id:'alerts',label:'Alerts & Notifications'},{id:'history',label:'Approval History'}];
  let body='';
  if(tab==='overview'){
    body=`<div class="grid cols-3">
        ${stat('Approved limit', egpC(b.limit), '📐','#E7E7F6','#34349A')}
        ${stat('Outstanding', egpC(b.used), '⇄','#E4ECF8','#1B4DA1',Math.round(b.used/b.limit*100)+'% utilised','flat')}
        ${stat('Available', egpC(avail), '✓','#E6F3EB','#15803D')}
      </div>
      <div class="grid cols-2" style="margin-top:16px">
        <div class="card card-pad"><h3 style="font-size:14.5px;margin-bottom:12px">Buyer information</h3>
          <div class="kv">
            <div class="row"><span class="k">Buyer</span><span class="v">${b.name}</span></div>
            <div class="row"><span class="k">Commercial Register</span><span class="v mono">${b.cr}</span></div>
            <div class="row"><span class="k">Payment terms</span><span class="v">${b.terms} · buffer ${b.buffer}</span></div>
            <div class="row"><span class="k">Finance rate</span><span class="v">${b.rate}</span></div>
            <div class="row"><span class="k">Linked suppliers</span><span class="v">${b.suppliers.length}</span></div>
            <div class="row"><span class="k">Alert status</span><span class="v"><span class="badge-st ${buyerAlertStatus(b).c}"><i class="bd"></i>${buyerAlertStatus(b).l}</span></span></div>
          </div></div>
        <div class="card card-pad"><h3 style="font-size:14.5px;margin-bottom:14px">Utilisation</h3>
          ${limitBar('Facility used',b.used,b.limit)}
          <div class="legend" style="margin-top:4px"><span><span class="sw" style="background:var(--brand)"></span>Outstanding ${egp(b.used)}</span><span><span class="sw" style="background:var(--surface-2)"></span>Available ${egp(avail)}</span></div>
        </div>
      </div>`;
  } else if(tab==='allocation'){
    body=`<div class="card"><div class="card-h"><h3>Supplier allocation</h3><div class="ch-act"><button class="btn btn-sm btn-ghost" onclick="toast('Re-allocate (prototype)','brand','📐')">Re-allocate</button></div></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Linked Supplier</th><th style="text-align:end">Allocated Limit</th><th style="text-align:end">Utilised Limit</th><th style="text-align:end">Remaining Limit</th><th>Utilisation</th></tr></thead><tbody>
      ${alloc.map(a=>`<tr class="row-link" onclick="go('supplier-detail','${a.s.id}')"><td>${party(a.s.name,'Linked supplier')}</td><td class="t-amt">${egp(a.allocated)}</td><td class="t-amt">${egp(a.utilized)}</td><td class="t-amt">${egp(a.remaining)}</td><td style="min-width:120px"><div class="progress"><i style="width:${Math.min(100,Math.round(a.utilized/a.allocated*100))}%"></i></div></td></tr>`).join('')}
      </tbody></table></div></div>
      <div class="alert info" style="margin-top:14px"><span class="ai">ℹ️</span><div>Allocated limits sub-divide the buyer's approved facility across linked suppliers. Re-allocation is governed by the Deviation Committee.</div></div>`;
  } else if(tab==='concentration'){
    body=`<div class="grid cols-2"><div class="card"><div class="card-h"><h3>Supplier concentration</h3></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Supplier</th><th style="text-align:end">Concentration %</th><th>Risk indicator</th></tr></thead><tbody>
      ${alloc.map(a=>`<tr><td>${party(a.s.name)}</td><td class="t-amt">${a.conc}%</td><td>${riskTag(a.conc)}</td></tr>`).join('')}
      </tbody></table></div></div>
      <div class="card card-pad"><h3 style="font-size:14.5px;margin-bottom:14px">Allocation distribution</h3>
        ${alloc.map(a=>`<div style="margin-bottom:13px"><div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px"><span class="t-strong">${a.s.short}</span><span class="t-sub">${a.conc}%</span></div><div class="progress"><i style="width:${a.conc*2}%;background:${a.conc>=40?'linear-gradient(90deg,#E0796F,#B42318)':a.conc>=25?'linear-gradient(90deg,#F6801F,#FBB833)':'linear-gradient(90deg,var(--brand-400),var(--brand))'}"></i></div></div>`).join('')}
        <div class="alert ${buyerConcStatus(b).l==='High'?'danger':buyerConcStatus(b).l==='Elevated'?'warn':'ok'}" style="margin-top:6px;font-size:12px"><span class="ai">⚖️</span><div>Portfolio concentration: <b>${buyerConcStatus(b).l}</b>. ${buyerConcStatus(b).l!=='Normal'?'Recommend Deviation Committee review of supplier distribution.':'Within policy thresholds.'}</div></div>
      </div></div>`;
  } else if(tab==='alerts'){
    const breaches=avail<0, near=avail>=0&&avail<b.limit*0.1, concAlerts=alloc.filter(a=>a.conc>=40), pendRev=cases.filter(c=>c.buyerId===b.id&&['fra','deviation','credit','submitted','pendingbuyer'].includes(c.stage));
    const alerts=[];
    if(breaches) alerts.push({t:'danger',ic:'⛔',h:'Limit breach',b:'Outstanding exceeds approved limit by '+egp(Math.abs(avail))+'.'});
    if(near) alerts.push({t:'warn',ic:'⚠️',h:'Near-limit warning',b:'Only '+egp(avail)+' headroom remaining ('+Math.round(avail/b.limit*100)+'%).'});
    concAlerts.forEach(a=>alerts.push({t:'warn',ic:'⚖️',h:'Concentration alert · '+a.s.short,b:a.s.name+' represents '+a.conc+'% of this buyer\'s facility.'}));
    if(pendRev.length) alerts.push({t:'info',ic:'⏳',h:pendRev.length+' pending review(s)',b:'Requests in FRA / Committee / Credit for this buyer.'});
    if(!alerts.length) alerts.push({t:'ok',ic:'✓',h:'No active alerts',b:'This buyer is within all limit and concentration thresholds.'});
    body=`<div class="grid" style="gap:12px">${alerts.map(a=>`<div class="alert ${a.t}"><span class="ai">${a.ic}</span><div><b>${a.h}</b><div style="margin-top:2px">${a.b}</div></div></div>`).join('')}</div>
      ${pendRev.length?`<div class="section-title">Pending reviews</div>`+caseTable(pendRev):''}`;
  } else {
    body=`<div class="grid cols-2"><div class="card card-pad"><h3 style="font-size:14.5px;margin-bottom:12px">Approval record</h3>
        <div class="kv">
          <div class="row"><span class="k">Created by</span><span class="v">RM · Yara Mansour</span></div>
          <div class="row"><span class="k">Created on</span><span class="v">2026-01-14</span></div>
          <div class="row"><span class="k">Credit approval</span><span class="v">Tarek Fouad · 2026-01-16</span></div>
          <div class="row"><span class="k">Committee decision</span><span class="v">${b.flagConc?'Allocation set · 2026-02-02':'Endorsed · 2026-01-18'}</span></div>
          <div class="row"><span class="k">Last reviewed</span><span class="v">2026-05-30</span></div>
          <div class="row"><span class="k">Approved limit</span><span class="v">${egp(b.limit)}</span></div>
        </div></div>
        <div class="card card-pad"><h3 style="font-size:14.5px;margin-bottom:8px">Committee decisions</h3>
          <div class="timeline" style="margin-top:8px">
            <div class="tl-item"><div class="tl-dot"></div><b>Facility approved</b><div class="tl-meta">Credit Team · 2026-01-16</div><p>${egp(b.limit)} approved · ${b.terms}.</p></div>
            <div class="tl-item"><div class="tl-dot"></div><b>Supplier allocation set</b><div class="tl-meta">Deviation Committee · 2026-02-02</div><p>Distributed across ${b.suppliers.length} linked suppliers.</p></div>
            <div class="tl-item"><div class="tl-dot"></div><b>Periodic review</b><div class="tl-meta">RM · 2026-05-30</div><p>No change to limit; concentration within policy.</p></div>
          </div></div></div>
      <div class="section-title">Audit trail</div>
      ${auditTimeline([mkAudit('RM · Yara Mansour','Limit created',egp(b.limit)+' requested'),mkAudit('Credit · Tarek Fouad','Limit approved','Risk grade assigned'),mkAudit('Deviation Committee','Allocation recorded','Supplier distribution set'),mkAudit('RM · Yara Mansour','Reviewed','Periodic review — no change')])}`;
  }
  const head=pageHead('Limit Management · '+b.short, b.name+' — Limit Details', 'Approved '+egp(b.limit)+' · Outstanding '+egp(b.used)+' · Available '+egp(avail),
      buyerScope?'':`<button class="btn btn-ghost" onclick="go('limits')">← All limits</button><button class="btn btn-primary" onclick="go('buyer-detail','${b.id}')">Buyer profile</button>`);
  return (buyerScope?wlBanner():'')+head+tabBar(tabs)+body;
}


/* ============================================================
   PART 3d — FACTORING · INVOICES · CASE · QUEUES
   ============================================================ */
function viewFactoring(){
  const node=(ic,col,txt)=>`<div class="mf-node"><span class="mn-ic" style="background:${col}">${ic}</span><b>${txt}</b></div>`;
  const arrow=`<div class="mf-arrow">↓</div>`;
  return pageHead('Factoring', 'Factoring Overview', 'Contact supports two factoring models. The client and obligor differ; the workflow adapts accordingly.')
    + `<div class="grid cols-2">
      <div class="card card-pad"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><span class="tag reverse" style="font-size:13px;padding:6px 11px">⇄ Reverse Factoring</span></div>
        <p class="t-sub" style="margin-bottom:14px">Main client: <b>Buyer</b>. Financing draws on the buyer's approved limit; the buyer pays on behalf of suppliers.</p>
        <div class="mini-flow">
          ${node('1','#34349A','RM creates buyer profile')}${arrow}
          ${node('2','#34349A','RM assigns financing limit')}${arrow}
          ${node('3','#34349A','RM links suppliers')}${arrow}
          ${node('4','#1B4DA1','Invoice uploaded (buyer or supplier)')}${arrow}
          ${node('5','#C2410C','If supplier-uploaded → Pending Buyer Validation')}${arrow}
          ${node('6','#4F46E5','FRA validation (internal)')}${arrow}
          ${node('7','#0E7490','Credit review & approval')}${arrow}
          ${node('8','#9333EA','Funded against buyer limit')}${arrow}
          ${node('9','#15803D','Buyer settles at maturity')}
        </div></div>
      <div class="card card-pad"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><span class="tag normal" style="font-size:13px;padding:6px 11px">⟳ Normal Factoring</span></div>
        <p class="t-sub" style="margin-bottom:14px">Main client: <b>Supplier</b>. The supplier is the financed customer and obligor (full recourse), linked to predefined buyers.</p>
        <div class="mini-flow">
          ${node('1','#15803D','RM creates supplier profile')}${arrow}
          ${node('2','#15803D','Supplier becomes financed client')}${arrow}
          ${node('3','#15803D','Supplier linked to buyers')}${arrow}
          ${node('4','#1B4DA1','Supplier uploads invoice')}${arrow}
          ${node('5','#4F46E5','FRA validation (internal)')}${arrow}
          ${node('6','#0E7490','Credit review & approval')}${arrow}
          ${node('7','#9333EA','Funded to supplier (recourse)')}${arrow}
          ${node('8','#15803D','Settled with recourse to supplier')}
        </div></div>
    </div>
    <div class="alert brand" style="margin-top:16px"><span class="ai">🛡️</span><div><b>Shared gates.</b> Both models pass internal <b>FRA Validation</b> and, where concentration is flagged, <b>Deviation Committee</b> review before credit approval, funding and settlement — each with a full audit trail.</div></div>`;
}

function viewInvoices(){
  const all=myCases();
  const f=state.invFilter||'all';
  const filtered = f==='all'?all : f==='active'?all.filter(c=>!['settled','closed','rejected'].includes(c.stage)) : f==='funded'?all.filter(c=>['funded','settled','closed'].includes(c.stage)) : all.filter(c=>c.stage===f);
  const isClient=state.role==='buyer'||state.role==='supplier';
  return pageHead('Invoice Management', isClient?'Invoices':'Invoice Management', 'Single and bulk upload, validation, approval, status tracking, documents and error handling.',
      `<button class="btn btn-ghost" onclick="go('invoice-bulk')">⇪ Bulk Upload</button><button class="btn btn-primary" onclick="go('invoice-new')">＋ Single Upload</button>`)
    + `<div class="toolbar"><div class="chips">
        ${[['all','All'],['active','Active'],['pendingbuyer','Buyer validation'],['fra','FRA'],['credit','Credit'],['approved','Approved'],['funded','Funded']].map(([k,l])=>`<span class="chip ${f===k?'on':''}" onclick="state.invFilter='${k}';route()">${l}</span>`).join('')}
      </div><div style="margin-inline-start:auto" class="tb-search"><span>⌕</span><input placeholder="Search invoice no…" onkeydown="if(event.key==='Enter')quickSearch(this.value)"></div></div>`
    + caseTable(filtered,{emptyTitle:'No invoices',emptyBody:'Upload a single invoice or a bulk file to get started.',emptyIcon:'🧾'});
}
function viewInvoiceNew(){
  const isSupplier=state.role==='supplier'; const isBuyer=state.role==='buyer';
  return pageHead('Invoice Management', 'Single Invoice Upload', 'Upload one invoice with supporting documents. Validation runs on submission.',
      `<button class="btn btn-ghost" onclick="go('invoices')">Cancel</button>`)
    + (isSupplier?`<div class="alert warn" style="margin-bottom:16px"><span class="ai">⏳</span><div>As a supplier on reverse factoring, your invoice first goes to <b>Pending Buyer Validation</b> before processing.</div></div>`:'')
    + `<div class="card card-pad" style="max-width:880px">
      <div class="form-grid">
        <div class="fld"><label>Counterparty (${isBuyer?'Supplier':'Buyer'}) <span class="req">*</span></label><select>${(isBuyer?myBuyer().suppliers.map(findSupplier):isSupplier?mySupplier().buyers.map(findBuyer):BUYERS).filter(Boolean).map(x=>`<option>${x.name}</option>`).join('')}</select></div>
        <div class="fld"><label>Factoring type</label><select><option>Reverse</option><option>Normal / recourse</option></select></div>
        ${fld('Invoice number','text','INV-2026-XXXX',true)}
        ${fld('Invoice amount (EGP)','text','0',true)}
        ${fld('Issue date','date','',true)}
        ${fld('Due date','date','',true)}
      </div>
      <div class="section-title">Documents</div>
      <div class="dropzone" onclick="simulateUpload(this)"><div class="dz-ic">⇪</div><b>Click to upload</b> commercial invoice, delivery note, PO<div class="t-sub" style="margin-top:4px">PDF, JPG, PNG · max 10MB</div><div class="upbar hidden" id="upDemo"><i style="width:0%"></i></div></div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px"><button class="btn btn-ghost" onclick="go('invoices')">Cancel</button><button class="btn btn-primary" onclick="submitInvoice('single')">Submit invoice</button></div>
    </div>`;
}
function viewInvoiceBulk(){
  const rows=[
    {n:'INV-2026-0501',a:'1,240,000',b:'BIM Stores',ok:true},
    {n:'INV-2026-0502',a:'860,000',b:'Kheir Zaman',ok:true},
    {n:'INV-2026-0503',a:'—',b:'Awlad Ragab',ok:false,err:'Missing amount'},
    {n:'INV-2026-0504',a:'2,100,000',b:'Unknown Co.',ok:false,err:'Buyer not linked'},
    {n:'INV-2026-0505',a:'540,000',b:'El Hamd',ok:true},
  ];
  const valid=rows.filter(r=>r.ok).length;
  return pageHead('Invoice Management', 'Bulk Invoice Upload', 'Upload a CSV/XLSX batch. Each row is validated; errors are flagged before submission.',
      `<button class="btn btn-ghost" onclick="go('invoices')">Cancel</button>`)
    + `<div class="card card-pad" style="margin-bottom:16px"><div class="dropzone" onclick="toast('Template parsed (prototype)','ok','⇪')"><div class="dz-ic">📄</div><b>Drop CSV / XLSX</b> or click to browse<div class="t-sub" style="margin-top:4px">Download the <a style="color:var(--brand);text-decoration:underline">batch template</a></div></div></div>
    <div class="card"><div class="card-h"><h3>Validation preview</h3><div class="ch-act"><span class="badge-st settled"><i class="bd"></i>${valid} valid</span><span class="badge-st rejected"><i class="bd"></i>${rows.length-valid} errors</span></div></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Invoice</th><th>Counterparty</th><th style="text-align:end">Amount</th><th>Validation</th></tr></thead><tbody>
      ${rows.map(r=>`<tr><td class="mono">${r.n}</td><td>${r.b}</td><td class="t-amt">${r.a}</td><td>${r.ok?'<span class="badge-st settled"><i class="bd"></i>Valid</span>':'<span class="badge-st rejected"><i class="bd"></i>'+r.err+'</span>'}</td></tr>`).join('')}
      </tbody></table></div></div>
    <div class="alert warn" style="margin-top:14px"><span class="ai">⚠️</span><div><b>2 rows need attention.</b> Fix flagged errors or exclude them. Only valid rows are submitted.</div></div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px"><button class="btn btn-ghost" onclick="toast('Errors exported','brand','📤')">Export errors</button><button class="btn btn-primary" onclick="submitInvoice('bulk')">Submit ${valid} valid invoices</button></div>`;
}

function viewCase(){
  const c=findCase(state.param); if(!c) return emptyState('Request not found','','🧾');
  const tab=state.tab||'overview';
  const internal=ROLES[state.role].internal;
  let tabs=[{id:'overview',label:'Overview'},{id:'documents',label:'Documents'}];
  if(internal) tabs.push({id:'validation',label:'FRA Validation'});
  tabs.push({id:'audit',label:'Audit Trail'});
  let body='';
  if(tab==='overview'){
    body=`<div class="card card-pad" style="margin-bottom:16px">${pipeline(c)}</div>
      <div class="detail-grid">
        <div class="card card-pad"><h3 style="font-size:14.5px;margin-bottom:12px">Request details</h3>
          <div class="kv">
            <div class="row"><span class="k">Invoice no.</span><span class="v mono">${c.invoiceNo}</span></div>
            <div class="row"><span class="k">Reference</span><span class="v mono">${c.ref}</span></div>
            <div class="row"><span class="k">Amount</span><span class="v">${egp(c.amount)}</span></div>
            <div class="row"><span class="k">Initiated by</span><span class="v">${c.initiator==='buyer'?'Buyer':'Supplier'}</span></div>
            <div class="row"><span class="k">Issued / Due</span><span class="v mono">${c.issue} → ${c.due}</span></div>
            <div class="row"><span class="k">Terms</span><span class="v">${c.terms}</span></div>
          </div></div>
        <div>
          <div class="card card-pad" style="margin-bottom:16px"><h3 style="font-size:13px;margin-bottom:10px">Parties</h3>
            <div style="margin-bottom:10px">${party(c.supplier,'Supplier')}</div>${party(c.buyer,'Buyer')}</div>
          ${caseActionPanel(c)}
        </div>
      </div>`;
  } else if(tab==='documents'){ body=docManager(c); }
  else if(tab==='validation' && internal){ body=validationPanel(c); }
  else { body=auditTimeline(c.audit); }
  return pageHead('Request · '+c.invoiceNo, c.invoiceNo+' — '+egp(c.amount), c.supplier+' → '+c.buyer,
      `<button class="btn btn-ghost" onclick="go('invoices')">← Invoices</button>${badge(c.stage)}`)
    + tabBar(tabs) + body;
}
function caseActionPanel(c){
  const acts=caseActions(c);
  return `<div class="card card-pad"><h3 style="font-size:13px;margin-bottom:6px">Status</h3>
    <div style="margin-bottom:10px">${badge(c.stage)}</div>
    <p class="t-sub" style="margin-bottom:14px">${stageHint(c)}</p>
    ${acts||'<p class="t-sub">No actions available for your role at this stage.</p>'}</div>`;
}
function caseActions(c){
  const r=state.role;
  const btn=(lbl,fn,cls)=>`<button class="btn ${cls||'btn-primary'} btn-block" style="margin-bottom:8px" onclick="${fn}">${lbl}</button>`;
  const info=(bg,col,ic,txt)=>`<div class="alert" style="background:${bg};color:${col}"><span class="ai">${ic}</span><div>${txt}</div></div>`;
  let h='';
  if(c.stage==='rejected') return `<div class="alert danger"><span class="ai">✕</span><div>Rejected at ${STAGE[c.rejFrom||'fra'].label}. ${c.notes||''}</div></div>`;
  if(c.stage==='closed') return `<div class="alert ok"><span class="ai">✓</span><div>Settled and closed. Lifecycle complete.</div></div>`;
  if(c.stage==='pendingbuyer'){
    if(r==='buyer'){ h+=btn('✓ Validate invoice','advanceCase(\''+c.id+'\',\'Buyer confirmed goods received & commitment to pay\')'); h+=btn('Dispute / reject','askReject(\''+c.id+'\')','btn-danger'); }
    else h+=info('var(--st-pendingbuyer-bg)','var(--st-pendingbuyer)','⏳','Awaiting buyer validation.');
    return h;
  }
  if(c.stage==='draft'){ if(r==='buyer'||r==='supplier') h+=btn('Submit request','advanceCase(\''+c.id+'\',\'Submitted for processing\')'); else h+=info('var(--surface-2)','var(--ink-soft)','📝','Draft — awaiting submission by the client.'); return h; }
  if(c.stage==='submitted'){ return info('var(--brand-50)','var(--brand-700)','🔄','Submitted — routing to automated FRA e-invoice validation.'); }
  if(c.stage==='fra'){ return info('var(--brand-50)','var(--brand-700)','🛡️','Automated FRA e-invoice validation in progress. No manual action required (future FRA system integration).'); }
  if(c.stage==='deviation'){ if(r==='deviation') h+=btn('Open committee decision →','go(\'deviation-detail\',\''+c.id+'\')'); else h+=info('var(--st-deviation-bg)','var(--st-deviation)','⚖️','At Deviation Committee — limit / concentration exceeded, awaiting override or reject.'); return h; }
  if(c.stage==='credit'){ if(r==='credit'){ h+=btn('✓ Validate execution & approve','advanceCase(\''+c.id+'\',\'Execution validated by Credit\')'); h+=btn('Reject','askReject(\''+c.id+'\')','btn-danger'); } else h+=info('var(--st-credit-bg)','var(--st-credit)','📊','At Contact execution validation.'); return h; }
  if(c.stage==='approved'){ if(r==='admin') h+=btn('💸 Simulate Finance funding (SWIFT)','advanceCase(\''+c.id+'\',\'Funds disbursed via instant SWIFT (Finance system integration)\')','btn-gold'); else h+=info('var(--st-approved-bg)','var(--st-approved)','✓','Approved — Finance funds via the Finance system; status auto-syncs through the integration.'); return h; }
  if(c.stage==='funded'){ if(r==='admin') h+=btn('Simulate settlement (proof of payment)','openSettle(\''+c.id+'\')','btn-gold'); else h+=info('var(--st-funded-bg)','var(--st-funded)','🏦','Funded — settlement handled in the Finance system; status auto-syncs through the integration.'); return h; }
  if(c.stage==='settled'){ if(r==='admin') h+=btn('Close request','advanceCase(\''+c.id+'\',\'Request closed\')','btn-quiet'); else h+=info('var(--st-settled-bg)','var(--st-settled)','✓','Settled.'); return h; }
  return h;
}
function stageHint(c){
  const m={ draft:'Draft — not yet submitted.', submitted:'Submitted; awaiting routing to FRA validation.',
    pendingbuyer:'Supplier-uploaded reverse invoice — buyer must validate before processing.',
    fra:'Internal FRA e-invoice validation. Not visible to buyer or supplier.',
    deviation:'Limit / concentration / global limit exceeded — Deviation Committee overrides or rejects.',
    credit:'Credit team assesses risk, limit and concentration.', approved:'Approved — ready for disbursement.',
    funded:'Advance disbursed; awaiting settlement at maturity.', settled:'Settled with the bank.', closed:'Closed.', rejected:'Rejected.' };
  return m[c.stage]||'';
}
function docManager(c){
  return `<div class="card"><div class="card-h"><h3>Documents</h3><div class="ch-act"><button class="btn btn-sm btn-primary" onclick="addDoc('${c.id}')">＋ Upload</button></div></div>
    <div class="card-pad">${c.docs.map(d=>`<div class="doc"><div class="di">📄</div><div><b>${d.n}</b><small>${d.t} · ${d.sz}</small></div><div class="da"><button class="btn btn-sm btn-quiet">View</button><button class="btn btn-sm btn-quiet">↓</button></div></div>`).join('')}
    ${['funded','settled','closed'].includes(c.stage)?`<div class="doc"><div class="di" style="background:var(--st-settled-bg)">🧾</div><div><b>Settlement advice.pdf</b><small>Finance · 92 KB</small></div><div class="da"><button class="btn btn-sm btn-quiet">View</button></div></div>`:''}</div></div>`;
}
function validationPanel(c){
  return `<div class="grid cols-2">
    <div class="card card-pad"><h3 style="font-size:14.5px;margin-bottom:6px">FRA validation</h3><div class="alert brand" style="font-size:12px;margin-bottom:12px"><span class="ai">🛡️</span><div>Internal only — hidden from buyer & supplier. Future FRA e-invoice system integration.</div></div>
      <div class="kv">
        <div class="row"><span class="k">Validation status</span><span class="v">${c.fraStatus==='validated'?'<span class="badge-st approved"><i class="bd"></i>Validated</span>':c.fraStatus==='pending'?'<span class="badge-st fra"><i class="bd"></i>Pending</span>':'—'}</span></div>
        <div class="row"><span class="k">e-Invoice UUID</span><span class="v mono">${c.fraStatus==='—'?'pending':'a1f9-'+c.ref.slice(-4)+'-egfra'}</span></div>
        <div class="row"><span class="k">Tax registration</span><span class="v mono">${c.fraStatus==='—'?'—':'EG-3920-1188'}</span></div>
      </div>
      <div class="fld" style="margin-top:12px"><label>Validation notes</label><textarea rows="2" placeholder="FRA validation notes…" readonly>${c.fraNotes}</textarea></div>
    </div>
    <div class="card card-pad"><h3 style="font-size:14.5px;margin-bottom:10px">Validation checklist</h3>
      ${['Invoice authenticated against FRA registry','Tax registration verified','No duplicate financing detected','Amount within buyer/supplier limit','Supporting documents complete'].map((x,i)=>`<div class="doc" style="padding:9px 11px"><div class="di" style="background:${i<3||c.fraStatus==='validated'?'var(--st-settled-bg)':'var(--surface-2)'};font-size:13px">${i<3||c.fraStatus==='validated'?'✓':'…'}</div><div><b style="font-size:12.5px">${x}</b></div></div>`).join('')}
    </div></div>`;
}

function viewPendingValidation(){
  const list=pendingForBuyer();
  return pageHead('Buyer Validation', 'Pending Buyer Validation', 'Supplier-uploaded reverse invoices awaiting your confirmation before processing.')
    + (list.length?`<div class="alert warn" style="margin-bottom:16px"><span class="ai">⏳</span><div>Confirm goods/services received, no dispute, and your commitment to pay at maturity. Validation releases the invoice into the workflow.</div></div>`:'')
    + caseTable(list,{actions:c=>`<button class="btn btn-sm btn-primary" onclick="advanceCase('${c.id}','Buyer validated')">Validate</button> <button class="btn btn-sm btn-danger" onclick="askReject('${c.id}')">Dispute</button>`, emptyTitle:'Nothing to validate', emptyBody:'No supplier invoices are awaiting your validation.', emptyIcon:'✓'});
}
function viewFRA(){
  const order=['fra','deviation','credit','approved','funded','settled','closed'];
  const q=cases.filter(c=>order.includes(c.stage)).sort((a,b)=>order.indexOf(a.stage)-order.indexOf(b.stage));
  const fraStatusTag=c=>c.stage==='fra'
    ? '<span class="badge-st fra"><i class="bd"></i>Pending (automated)</span>'
    : '<span class="badge-st approved"><i class="bd"></i>Validated</span>';
  return pageHead('Workflow', 'FRA Validation', 'View-only monitor. FRA e-invoice validation runs automatically (future FRA system integration) — no manual action is taken here.')
    + `<div class="alert brand" style="margin-bottom:16px"><span class="ai">🛡️</span><div><b>Automated stage.</b> Each request is validated against the FRA e-invoice registry on submission. This screen shows the validation status and creation date of each request.</div></div>`
    + (q.length?`<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Invoice / Ref</th><th>Supplier</th><th>Buyer</th><th style="text-align:end">Amount</th><th>FRA Status</th><th>Current stage</th><th>Creation date</th></tr></thead><tbody>
      ${q.map(c=>`<tr class="row-link" onclick="openCase('${c.id}')"><td><div class="t-strong mono">${c.invoiceNo}</div><div class="t-sub mono">${c.ref}</div></td><td>${party(c.supplier,'Supplier')}</td><td>${party(c.buyer,'Buyer')}</td><td class="t-amt">${egp(c.amount)}</td><td>${fraStatusTag(c)}</td><td>${badge(c.stage)}</td><td class="t-sub mono">${c.issue}</td></tr>`).join('')}
      </tbody></table></div></div>`
    : emptyState('No requests in validation','Requests appear here once submitted.','🛡️'));
}
function viewDeviation(){
  const q=cases.filter(c=>c.stage==='deviation');
  return pageHead('Workflow', 'Deviation Committee', 'Decide on requests where the available limit, counterparty concentration % or the global concentration limit is exceeded — override (proceed) or reject.')
    + `<div class="alert warn" style="margin-bottom:16px"><span class="ai">⚖️</span><div><b>Exceedance decisions only.</b> The obligor check runs automatically; a request reaches the committee only when a limit is exceeded or the global limit is fully utilised. The committee may <b>override</b> to proceed (on the available / requested portion) or <b>reject</b>.</div></div>`
    + caseTable(q,{actions:c=>`<button class="btn btn-sm btn-primary" onclick="go('deviation-detail','${c.id}')">Decide</button>`, emptyTitle:'No deviations pending', emptyBody:'No requests have exceeded their limit or concentration.', emptyIcon:'⚖️'});
}
function viewDeviationDetail(){
  const c=findCase(state.param); if(!c) return emptyState('Request not found','','⚖️');
  const isSupplierObligor = c.type==='normal';
  const ob = isSupplierObligor ? findSupplier(c.supplierId) : findBuyer(c.buyerId);
  const limit = ob? ob.limit : 0, used = ob? ob.used : 0, avail = limit-used;
  const reqd = c.amount, exceeded = reqd>avail;
  const concParty = isSupplierObligor ? findBuyer(c.buyerId) : findSupplier(c.supplierId);
  const concVal = isSupplierObligor ? (concParty&&concParty.short) : (concParty&&concParty.conc);
  return pageHead('Deviation Committee', 'Exceedance Decision — '+c.invoiceNo, ob.name+' · '+egp(c.amount),
      `<button class="btn btn-ghost" onclick="go('deviation-queue')">← Queue</button>`)
    + `<div class="detail-grid">
      <div>
        <div class="card card-pad" style="margin-bottom:16px"><h3 style="font-size:14.5px;margin-bottom:12px">Obligor check — ${ob.short}</h3>
          <div class="kv">
            <div class="row"><span class="k">Obligor (${isSupplierObligor?'supplier':'buyer'})</span><span class="v">${ob.name}</span></div>
            <div class="row"><span class="k">Approved limit</span><span class="v mono">${egp(limit)}</span></div>
            <div class="row"><span class="k">Outstanding / utilised</span><span class="v mono">${egp(used)}</span></div>
            <div class="row"><span class="k">Available headroom</span><span class="v mono" style="color:${avail<reqd?'var(--st-rejected)':'var(--st-settled)'}">${egp(avail)}</span></div>
            <div class="row"><span class="k">Requested amount</span><span class="v mono">${egp(reqd)}</span></div>
            <div class="row"><span class="k">${isSupplierObligor?'Buyer':'Supplier'} concentration</span><span class="v mono">${isSupplierObligor?concVal:(concVal||'—')}</span></div>
            <div class="row"><span class="k">Global concentration limit</span><span class="v">${c.flagConc?'<span class="badge-st rejected"><i class="bd"></i>Exceeded</span>':'<span class="badge-st approved"><i class="bd"></i>Within</span>'}</span></div>
          </div>
          <div class="alert ${exceeded?'danger':'warn'}" style="margin-top:14px;font-size:12.5px"><span class="ai">⚠️</span><div><b>${exceeded?'Limit exceeded.':'Concentration / global limit exceeded.'}</b> ${exceeded?('Requested '+egp(reqd)+' exceeds available headroom of '+egp(avail)+'. Overriding finances the available portion ('+egp(Math.max(0,avail))+') — partial utilisation.'):'Counterparty concentration or the global concentration limit is exceeded; a committee decision is required to proceed.'}</div></div>
        </div>
        <div class="card card-pad"><h3 style="font-size:14.5px;margin-bottom:12px">Committee decision</h3>
          <div class="seg" style="margin-bottom:14px"><button class="on" id="utilFull" onclick="setUtil('${c.id}','full',this)">Finance in full</button><button id="utilPart" onclick="setUtil('${c.id}','partial',this)">Partial — available portion</button></div>
          <div class="fld full"><label>Committee note (recorded in audit) <span style="color:var(--st-rejected)">*</span></label><textarea id="devNote" rows="3" placeholder="Rationale for override or reject…"></textarea></div>
        </div>
      </div>
      <div>
        ${caseActionPanel(c)}
        ${state.role==='deviation'?`<div class="card card-pad" style="margin-top:16px"><h3 style="font-size:13px;margin-bottom:10px">Committee actions</h3>
          <button class="btn btn-primary btn-block" style="margin-bottom:8px" onclick="overrideCase('${c.id}')">✓ Override — proceed</button>
          <button class="btn btn-danger btn-block" onclick="askReject('${c.id}')">Reject — exceedance not approved</button>
        </div>`:`<div class="card card-pad" style="margin-top:16px"><div class="alert info" style="margin:0;font-size:12px"><span class="ai">👁</span><div>View-only. Only the Deviation Committee can override or reject.</div></div></div>`}
        <div class="card card-pad" style="margin-top:16px"><h3 style="font-size:13px;margin-bottom:8px">Decision history</h3>
          ${auditTimeline(c.audit)}
        </div>
      </div>
    </div>`;
}
function viewCredit(){
  const q=cases.filter(c=>c.stage==='credit');
  return pageHead('Workflow', 'Execution Validation Queue', 'After the obligor check (and any committee override), Contact validates each request for execution — approve to fund, or reject.')
    + caseTable(q,{actions:c=>`<button class="btn btn-sm btn-primary" onclick="openCase('${c.id}')">Validate</button>`, emptyTitle:'Queue clear', emptyBody:'No requests awaiting execution validation.', emptyIcon:'📊'});
}
function viewApprovals(){
  const q=cases.filter(c=>['submitted','pendingbuyer','fra','deviation','credit'].includes(c.stage));
  return pageHead('Workflow', 'Approvals', 'All requests awaiting an action across the approval chain.')
    + `<div class="toolbar"><div class="chips"><span class="chip on">All pending</span><span class="chip">Buyer validation</span><span class="chip">FRA</span><span class="chip">Committee</span><span class="chip">Credit</span></div></div>`
    + caseTable(q,{actions:c=>`<button class="btn btn-sm btn-primary" onclick="openCase('${c.id}')">Open</button>`, emptyTitle:'All clear', emptyBody:'Nothing is awaiting approval.', emptyIcon:'✓'});
}
function viewFinance(){
  const fund=cases.filter(c=>c.stage==='approved'), settle=cases.filter(c=>c.stage==='funded');
  return pageHead('Finance', 'Funding & Settlement', 'Disburse approved requests, settle with banks and upload settlement documents.')
    + `<div class="alert info" style="margin-bottom:16px"><span class="ai">🔌</span><div><b>API-ready.</b> Built to auto-sync proof of payment and finance documents from the finance system in future.</div></div>`
    + `<div class="section-title" style="margin-top:0">Ready to fund</div>`
    + caseTable(fund,{actions:c=>`<button class="btn btn-sm btn-primary" onclick="advanceCase('${c.id}','Funds disbursed via instant SWIFT')">Fund</button>`, emptyTitle:'Nothing to fund', emptyBody:'No approved requests pending disbursement.', emptyIcon:'🏦'})
    + `<div class="section-title">Funded — awaiting settlement</div>`
    + caseTable(settle,{actions:c=>`<button class="btn btn-sm btn-gold" onclick="openSettle('${c.id}')">Settle</button>`, emptyTitle:'Nothing to settle', emptyBody:'No funded requests pending settlement.', emptyIcon:'💳'});
}
function viewSettlements(){
  const list=myCases().filter(c=>['funded','settled','closed'].includes(c.stage));
  const settleDate=c=>c.stage==='funded'?'<span class="t-sub">— pending —</span>':`<span class="mono">${c.due}</span>`;
  return pageHead('Finance', 'Settlement Tracking', 'View-only tracking of funded, settled and closed requests with settlement dates and proof of payment. Settlement actions are performed on the Funding & Settlement page by Finance.')
    + (list.length?`<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Invoice / Ref</th><th>Supplier</th><th>Buyer</th><th style="text-align:end">Amount</th><th>Status</th><th>Funded on</th><th>Settlement date</th></tr></thead><tbody>
      ${list.map(c=>`<tr class="row-link" onclick="openCase('${c.id}')"><td><div class="t-strong mono">${c.invoiceNo}</div><div class="t-sub mono">${c.ref}</div></td><td>${party(c.supplier,'Supplier')}</td><td>${party(c.buyer,'Buyer')}</td><td class="t-amt">${egp(c.amount)}</td><td>${badge(c.stage)}</td><td class="t-sub mono">${c.issue}</td><td>${settleDate(c)}</td></tr>`).join('')}
      </tbody></table></div></div>`
    : emptyState('No settlements yet','Funded requests appear here for tracking.','💳'));
}
function viewFinancing(){
  const list=myCases().filter(c=>!['draft','rejected'].includes(c.stage));
  return pageHead(state.role==='supplier'?'Supplier':'Buyer', 'Financing '+(state.role==='supplier'?'Status':'Requests'), 'Track each financing request through the workflow.')
    + caseTable(list,{emptyTitle:'No financing requests',emptyBody:'Upload an invoice to request financing.',emptyIcon:'📈'});
}
function viewEscrowAck(){
  const list=escrowPending();
  return pageHead('Supplier', 'Escrow Acknowledgements', 'Silent-factoring requests requiring you to confirm collection only via Contact\'s escrow account.')
    + (list.length?`<div class="alert" style="background:var(--st-deviation-bg);color:var(--st-deviation);margin-bottom:16px"><span class="ai">🔐</span><div>Under silent factoring the buyer is not notified. You must route all collections to the designated escrow account.</div></div>`:'')
    + caseTable(list,{actions:c=>`<button class="btn btn-sm btn-primary" onclick="ackEscrow('${c.id}')">Acknowledge</button>`, emptyTitle:'Nothing to acknowledge', emptyBody:'No silent-factoring acknowledgements pending.', emptyIcon:'🔐'});
}
function viewDocuments(){
  const list=myCases();
  return pageHead('Documents', 'Document Centre', 'All documents across your requests — invoices, delivery notes, settlement advice.')
    + `<div class="card"><div class="card-pad">
      ${list.slice(0,8).map(c=>`<div class="doc" style="cursor:pointer" onclick="openCase('${c.id}')"><div class="di">📄</div><div><b>${c.invoiceNo} · Commercial invoice.pdf</b><small>${c.supplier} → ${c.buyer} · ${egp(c.amount)}</small></div><div class="da">${badge(c.stage)}</div></div>`).join('')||emptyState('No documents','Documents appear as you create requests.','📁')}
    </div></div>`;
}


/* ============================================================
   PART 3e — ADMIN · IA · REPORTS · SETTINGS
   ============================================================ */
function viewUsers(){
  const users=[
    {n:'Yara Mansour',r:'rm',e:'yara.mansour@contact.eg'},
    {n:'Tarek Fouad',r:'credit',e:'tarek.fouad@contact.eg'},
    {n:'Nadia Saleh',r:'fra',e:'nadia.saleh@contact.eg'},
    {n:'Hany Greiss',r:'deviation',e:'committee@contact.eg'},
    {n:'Omar Khalil',r:'finance',e:'omar.khalil@contact.eg'},
    {n:'Carrefour Egypt',r:'buyer',e:'finance@carrefour.eg'},
    {n:'Pepsi Egypt',r:'buyer',e:'ap@pepsi.eg'},
    {n:'BIM Stores',r:'supplier',e:'ar@bim.eg'},
    {n:'Awlad Ragab',r:'supplier',e:'collections@awladragab.eg'},
  ];
  return pageHead('Administration', 'User Management', 'Provision and manage internal and external accounts across all roles.',
      `<button class="btn btn-primary" onclick="toast('Invite user (prototype)','brand','👤')">＋ Invite user</button>`)
    + `<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>User</th><th>Role</th><th>Email</th><th>Type</th><th>Status</th></tr></thead><tbody>
      ${users.map(u=>`<tr><td>${party(u.n)}</td><td><span class="tag" style="background:${ROLES[u.r].bg};color:${ROLES[u.r].color}">${ROLES[u.r].icon} ${ROLES[u.r].name}</span></td><td class="t-sub">${u.e}</td><td>${ROLES[u.r].internal?'Internal':'External'}</td><td><span class="badge-st settled"><i class="bd"></i>Active</span></td></tr>`).join('')}
    </tbody></table></div></div>`;
}
function viewPermissions(){
  const caps=['View dashboards','Create profiles','Set limits','Upload invoices','Validate (buyer)','FRA validation','Committee review','Credit approval','Fund & settle','Manage users'];
  const grid={
    rm:[1,1,1,1,1,0,0,0,0,0], buyer:[1,0,0,1,1,0,0,0,0,0], supplier:[1,0,0,1,0,0,0,0,0,0],
    credit:[1,0,2,0,0,0,2,1,0,0], fra:[1,0,0,0,0,1,0,0,0,0], deviation:[1,0,2,0,0,0,1,0,0,0],
    finance:[1,0,0,0,0,0,0,0,1,0], admin:[1,2,2,0,0,0,0,0,0,1],
  };
  const cell=v=>v===1?'<span class="yes">●</span>':v===2?'<span class="part">◐</span>':'<span class="no">○</span>';
  return pageHead('Administration', 'Roles & Permissions', 'Access matrix across the eight portal roles.')
    + `<div class="card"><div class="tbl-wrap"><table class="matrix"><thead><tr><th>Capability</th>${Object.keys(grid).map(r=>`<th>${ROLES[r].short}</th>`).join('')}</tr></thead><tbody>
      ${caps.map((cap,i)=>`<tr><td>${cap}</td>${Object.keys(grid).map(r=>`<td>${cell(grid[r][i])}</td>`).join('')}</tr>`).join('')}
    </tbody></table></div></div>
    <div class="legend"><span><span class="yes">●</span> Full</span><span><span class="part">◐</span> Partial / review</span><span><span class="no">○</span> None</span></div>`;
}
function viewSitemap(){
  const groups=[
    {h:'🔐 Authentication',ic:'#34349A',items:['Operations login (email + password)','Clients login (mobile + OTP)','Forgot-password flow','OTP journey & resend','Mobile app QR']},
    {h:'◎ Dashboards',ic:'#1B4DA1',items:['RM','Buyer (white-labelled)','Supplier','Credit','FRA','Deviation','Finance','Admin']},
    {h:'🏢 Clients & Profiles',ic:'#15803D',items:['Buyer management & branding','Supplier management','Supplier linking','Profiles & audit']},
    {h:'📐 Limit Management',ic:'#B5651A',items:['Main limits table','Overview','Supplier allocation','Concentration analysis','Alerts','Approval history']},
    {h:'🧾 Factoring & Invoices',ic:'#9333EA',items:['Factoring overview','Single upload','Bulk upload','Case file & pipeline','Pending buyer validation']},
    {h:'🛡️ Workflow & Approvals',ic:'#4F46E5',items:['FRA validation','Deviation committee','Credit review','Approvals','Audit trail']},
    {h:'🏦 Finance',ic:'#0E7490',items:['Funding & settlement','Settlement tracking','Escrow acknowledgements','Documents']},
    {h:'⚙️ Administration',ic:'#5A6B72',items:['Users','Roles & permissions','Workflow visualization','Reports','Settings']},
  ];
  return pageHead('Administration', 'Information Architecture', 'Full sitemap of the Contact Digital Factoring Portal.')
    + `<div class="sitemap">${groups.map(g=>`<div class="sm-node"><h4><span style="color:${g.ic}">${g.h}</span></h4><ul>${g.items.map(i=>`<li>${i}</li>`).join('')}</ul></div>`).join('')}</div>`;
}
function viewWorkflow(){
  const stages=['draft','submitted','pendingbuyer','fra','deviation','credit','approved','funded','settled','closed'];
  return pageHead('Administration', 'Workflow Visualization', 'End-to-end status pipeline. Conditional stages: buyer validation (supplier-uploaded reverse) and committee (concentration flagged).')
    + `<div class="card card-pad" style="margin-bottom:16px"><div class="pipe-rail">${stages.map((s,i)=>`<div class="pipe-step ${i<3?'done':i===3?'current':''}"><div class="ps-line"></div><div class="ps-dot">${i<3?'✓':i+1}</div><div class="ps-lab">${STAGE[s].short}</div></div>`).join('')}</div></div>`
    + `<div class="grid cols-2">
        <div class="card card-pad"><h3 style="font-size:14px;margin-bottom:12px"><span class="tag reverse">⇄ Reverse</span> path</h3><div class="legend" style="margin-top:0"><span>Draft → Submitted → <b style="color:var(--st-pendingbuyer)">Buyer validation*</b> → FRA → <b style="color:var(--st-deviation)">Committee†</b> → Credit → Approved → Funded → Settled → Closed</span></div><p class="t-sub" style="margin-top:10px">*Only when a supplier uploads. †Only when concentration is flagged.</p></div>
        <div class="card card-pad"><h3 style="font-size:14px;margin-bottom:12px"><span class="tag normal">⟳ Normal</span> path</h3><div class="legend" style="margin-top:0"><span>Draft → Submitted → FRA → <b style="color:var(--st-deviation)">Committee†</b> → Credit → Approved → Funded → Settled (recourse) → Closed</span></div><p class="t-sub" style="margin-top:10px">Supplier is client & obligor; full recourse on buyer default.</p></div>
      </div>
      <div class="card card-pad" style="margin-top:16px"><h3 style="font-size:14px;margin-bottom:12px">Status legend</h3><div class="legend">${stages.concat(['rejected']).map(s=>`<span><span class="sw" style="background:var(--st-${STAGE[s].cls})"></span>${STAGE[s].label}</span>`).join('')}</div></div>`;
}
function viewAudit(){
  const ev=[];
  cases.forEach(c=>c.audit.forEach(a=>ev.push({...a,ref:c.invoiceNo,id:c.id})));
  ev.sort((a,b)=>a.ts<b.ts?1:-1);
  return pageHead('Administration', 'Audit Logs', 'Immutable, time-stamped record of every action across the portal.')
    + `<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Timestamp</th><th>Actor</th><th>Action</th><th>Reference</th><th>Note</th></tr></thead><tbody>
      ${ev.slice(0,30).map(a=>`<tr class="row-link" onclick="openCase('${a.id}')"><td class="t-sub mono">${a.ts}</td><td>${a.actor}</td><td class="t-strong">${a.action}</td><td class="mono">${a.ref}</td><td class="t-sub">${a.note||'—'}</td></tr>`).join('')}
    </tbody></table></div></div>`;
}
function viewReports(){
  const totalLimit=BUYERS.reduce((a,b)=>a+b.limit,0), used=BUYERS.reduce((a,b)=>a+b.used,0);
  const funded=cases.filter(c=>['funded','settled','closed'].includes(c.stage));
  const byStage={}; cases.forEach(c=>byStage[c.stage]=(byStage[c.stage]||0)+1);
  return pageHead('Reports', 'Portfolio Reports', 'Exposure, utilisation, throughput and concentration across the book.',
      `<button class="btn btn-ghost" onclick="toast('PDF export (prototype)','brand','📤')">Export PDF</button>`)
    + `<div class="grid cols-4">
        ${stat('Approved limits', egpC(totalLimit), '📐','#E7E7F6','#34349A')}
        ${stat('Outstanding', egpC(used), '⇄','#E4ECF8','#1B4DA1',Math.round(used/totalLimit*100)+'%','flat')}
        ${stat('Funded YTD', egpC(funded.reduce((a,c)=>a+c.amount,0)), '🏦','#F4E8FC','#9333EA',funded.length+' invoices','up')}
        ${stat('Avg. ticket', egpC(Math.round(cases.reduce((a,c)=>a+c.amount,0)/cases.length)), '🧾','#FEF1E0','#B5651A')}
      </div>`
    + `<div class="grid cols-2" style="margin-top:16px">
        <div class="card card-pad"><h3 style="font-size:14px;margin-bottom:14px">Requests by stage</h3>
          ${Object.keys(STAGE).filter(s=>byStage[s]).map(s=>`<div style="margin-bottom:11px"><div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px"><span>${STAGE[s].label}</span><span class="t-sub">${byStage[s]}</span></div><div class="progress"><i style="width:${byStage[s]/cases.length*100}%;background:var(--st-${STAGE[s].cls})"></i></div></div>`).join('')}
        </div>
        <div class="card card-pad"><h3 style="font-size:14px;margin-bottom:14px">Buyer utilisation</h3>
          ${BUYERS.map(b=>limitBar(b.short,b.used,b.limit)).join('')}
        </div>
      </div>`;
}
function viewNotifications(){
  const list=myNotifs();
  return pageHead('Notifications', 'Notifications', 'Workflow events, alerts and confirmations for your role.',
      `<button class="btn btn-ghost" onclick="toast('All marked read','ok','✓')">Mark all read</button>`)
    + `<div class="card"><div class="card-pad">
      ${list.length?list.map(n=>`<div class="notif ${n.unread?'unread':''}"><div class="nic" style="background:${n.bg};color:${n.col}">${n.icon}</div><div style="flex:1"><b style="font-size:13.5px">${n.title}</b><p style="margin:3px 0 0;font-size:12.5px;color:var(--ink-soft)">${n.body}</p><div class="t-sub" style="margin-top:4px">${n.time}</div></div>${n.unread?'<span class="ndot" style="position:static;margin-top:6px"></span>':''}</div>`).join(''):emptyState('No notifications','You\'re all caught up.','🔔')}
    </div></div>`;
}
function saveProfileName(){ const v=el('profName')?el('profName').value.trim():''; if(!v){ toast('Name cannot be empty','warn','⚠️'); return; } ROLES[state.role].user=v; renderSidebar(); renderTopbar(); route(); toast('Profile name updated','ok','✓'); }
function viewSettings(){
  const r=ROLES[state.role];
  const admin=state.role==='admin';
  const pref=(label,on)=>`<div class="doc" style="padding:12px 14px;${admin?'':'opacity:.7'}"><div style="flex:1"><b style="font-size:13px">${label}</b></div><label style="position:relative;display:inline-block;width:42px;height:24px;${admin?'':'pointer-events:none'}"><input type="checkbox" ${on?'checked':''} ${admin?'':'disabled'} style="opacity:0;width:0;height:0"><span style="position:absolute;cursor:${admin?'pointer':'not-allowed'};inset:0;background:${on?'var(--brand)':'var(--line-strong)'};border-radius:99px;transition:.2s"><span style="position:absolute;height:18px;width:18px;left:${on?'21px':'3px'};top:3px;background:#fff;border-radius:50%;transition:.2s"></span></span></label></div>`;
  return pageHead('Settings', 'Settings & Preferences', 'Manage your profile, notification preferences and language.')
    + `<div class="grid cols-2">
      <div class="card card-pad"><h3 style="font-size:14.5px;margin-bottom:14px">Profile</h3>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px"><div class="user-chip" style="cursor:default"><div class="av">${initials(r.user)}</div><div><b>${r.user}</b><small>${r.name}</small></div></div></div>
        ${r.internal?`<div class="fld full" style="margin-bottom:14px"><label>Display name</label><div style="display:flex;gap:8px"><input id="profName" value="${r.user}"><button class="btn btn-primary btn-sm" onclick="saveProfileName()">Save</button></div></div>`:''}
        <div class="kv">
          <div class="row"><span class="k">Company</span><span class="v">${r.company}</span></div>
          <div class="row"><span class="k">User type</span><span class="v">${r.name}</span></div>
          <div class="row"><span class="k">Mobile</span><span class="v mono">${r.mobile}</span></div>
          <div class="row"><span class="k">Email</span><span class="v">${r.email}</span></div>
          <div class="row"><span class="k">Status</span><span class="v"><span class="badge-st settled"><i class="bd"></i>Active</span></span></div>
          <div class="row"><span class="k">Last login</span><span class="v">${r.last}</span></div>
        </div>
        <div class="section-title">Language</div>
        <div class="lang-toggle" style="width:fit-content"><button class="${state.lang==='en'?'on':''}" onclick="setLang('en')">English</button><button class="${state.lang==='ar'?'on':''}" onclick="setLang('ar')">العربية</button></div>
      </div>
      <div class="card card-pad"><h3 style="font-size:14.5px;margin-bottom:14px">Notification preferences</h3>
        ${admin?`<div class="fld full" style="margin-bottom:12px"><label>Manage notifications for</label><select id="notifTarget"><option>All users</option>${Object.keys(ROLES).map(k=>`<option>${ROLES[k].name}</option>`).join('')}${BUYERS.map(b=>`<option>Buyer · ${b.name}</option>`).join('')}${SUPPLIERS.map(s=>`<option>Supplier · ${s.name}</option>`).join('')}</select></div>`:`<div class="alert info" style="margin-bottom:14px"><span class="ai">🔒</span><div>Notification preferences are managed by your administrator.</div></div>`}
        ${pref('Email notifications',true)}
        ${pref('SMS notifications',true)}
        ${pref('WhatsApp notifications',false)}
        ${pref('Invoice status updates',true)}
        ${pref('Limit & concentration alerts',true)}
        ${pref('Approval requests',true)}
        ${pref('Settlement confirmations',false)}
        ${admin?`<div style="margin-top:14px"><button class="btn btn-primary btn-sm" onclick="toast('Preferences saved for '+(el('notifTarget')?el('notifTarget').value:'user'),'ok','✓')">Save preferences</button></div>`:''}
      </div>
    </div>`;
}

function viewSearch(){
  const q=(state.searchQ||'').toLowerCase().trim();
  const internal=ROLES[state.role].internal;
  const hit=(s)=>(s||'').toLowerCase().includes(q);
  const buyerHits = internal ? BUYERS.filter(b=>hit(b.name)||hit(b.short)||hit(b.cr)) : [];
  const supplierHits = internal ? SUPPLIERS.filter(s=>hit(s.name)||hit(s.short)||hit(s.cr)) : [];
  const scope = internal ? cases : myCases();
  const caseHits = scope.filter(c=>hit(c.invoiceNo)||hit(c.ref)||hit(c.buyer)||hit(c.supplier)||hit(String(c.amount)));
  const total = buyerHits.length+supplierHits.length+caseHits.length;
  let body='';
  if(!total){ body=emptyState('No results for "'+state.searchQ+'"','Try an invoice number, buyer, supplier or reference.','⌕'); }
  else {
    if(buyerHits.length) body+=`<div class="section-title" style="margin-top:0">Buyers · ${buyerHits.length}</div><div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Buyer</th><th style="text-align:end">Approved Limit</th><th>Status</th></tr></thead><tbody>${buyerHits.map(b=>`<tr class="row-link" onclick="go('buyer-detail','${b.id}')"><td>${party(b.name,b.cr)}</td><td class="t-amt">${egp(b.limit)}</td><td>${b.status==='active'?'<span class="badge-st settled"><i class="bd"></i>Active</span>':'<span class="badge-st submitted"><i class="bd"></i>Onboarding</span>'}</td></tr>`).join('')}</tbody></table></div></div>`;
    if(supplierHits.length) body+=`<div class="section-title">Suppliers · ${supplierHits.length}</div><div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Supplier</th><th>Linked buyers</th><th style="text-align:end">Limit</th></tr></thead><tbody>${supplierHits.map(s=>`<tr class="row-link" onclick="go('supplier-detail','${s.id}')"><td>${party(s.name,s.cr)}</td><td>${s.buyers.map(id=>(findBuyer(id)||{}).short).filter(Boolean).join(', ')}</td><td class="t-amt">${egp(s.limit)}</td></tr>`).join('')}</tbody></table></div></div>`;
    if(caseHits.length) body+=`<div class="section-title">Invoices · ${caseHits.length}</div>`+caseTable(caseHits);
  }
  return pageHead('Search', 'Search results', total+' result'+(total===1?'':'s')+' for "'+state.searchQ+'"',
      `<button class="btn btn-ghost" onclick="goBack()">← Back</button>`) + body;
}


/* ============================================================
   PART 4 — ACTIONS · MODALS · INIT
   ============================================================ */
function toast(msg,type,icon){
  const wrap=el('toasts'); const d=document.createElement('div');
  d.className='toast '+(type||'');
  d.innerHTML=`<span class="ti">${icon||'🔔'}</span><div>${msg}</div>`;
  wrap.appendChild(d);
  setTimeout(()=>{ d.style.opacity='0'; d.style.transform='translateX(20px)'; setTimeout(()=>d.remove(),250); }, 3200);
}
function openModal(html,kind){
  const o=el('overlay');
  o.innerHTML=`<div class="${kind==='drawer'?'drawer':'modal'}">${html}</div>`;
  o.classList.add('open');
}
function closeModal(){ const o=el('overlay'); o.classList.remove('open'); setTimeout(()=>{o.innerHTML='';},200); }

function transitionLabel(from,to){
  const m={ pendingbuyer:'validated by buyer', fra:'passed FRA validation', deviation:'cleared committee allocation',
    credit:'credit-approved', approved:'approved', funded:'funded via SWIFT', settled:'settled', closed:'closed', submitted:'submitted' };
  return m[to]||('moved to '+STAGE[to].label);
}
function autoFlow(c){
  // 'submitted' and 'fra' are automated (no human action). Pass straight through.
  const AUTO={ submitted:'Routed to FRA validation (automated)', fra:'FRA e-invoice validation passed (automated integration)' };
  let guard=0;
  while(AUTO[c.stage] && guard++<8){
    const nx=nextStage(c); if(!nx) break;
    if(c.stage==='fra') c.fraStatus='validated';
    const note=AUTO[c.stage];
    c.prevStage=c.stage; c.stage=nx;
    c.audit.push(mkAudit('System · FRA e-invoice','Auto-advanced to '+STAGE[nx].label, note));
  }
}
function advanceCase(id,note){
  const c=findCase(id); if(!c) return;
  const from=c.stage; const to=nextStage(c);
  if(!to){ toast('No further stage.','warn','ℹ️'); return; }
  c.prevStage=from; c.stage=to;
  if(to==='fra') c.fraStatus='pending';
  if(from==='fra') c.fraStatus='validated';
  const actor=ROLES[state.role].name+' · '+ROLES[state.role].user;
  c.audit.push(mkAudit(actor, 'Advanced to '+STAGE[to].label, note||''));
  autoFlow(c);
  if(c.stage==='funded'){ toast('Instant SWIFT sent — '+egp(c.amount)+' disbursed','brand','💸'); }
  else if(c.stage==='pendingbuyer'){ toast('Sent to buyer for validation','warn','⏳'); }
  else if(to==='fra'||to==='submitted'){ toast('FRA e-invoice validation passed — at '+STAGE[c.stage].label,'ok','🛡️'); }
  else { toast('Request '+transitionLabel(from,to),'ok','✓'); }
  renderSidebar(); renderTopbar(); route();
}
function setUtil(id,mode,btnEl){
  const c=findCase(id); if(!c) return; c.util=mode;
  if(btnEl&&btnEl.parentElement){ [...btnEl.parentElement.children].forEach(b=>b.classList.remove('on')); btnEl.classList.add('on'); }
}
function overrideCase(id){
  const c=findCase(id); if(!c) return;
  const note=(el('devNote')&&el('devNote').value.trim())||'';
  if(!note){ toast('A committee note is required','warn','⚠️'); if(el('devNote'))el('devNote').focus(); return; }
  const partial = c.util==='partial';
  c.partial=partial;
  c.audit.push(mkAudit(ROLES.deviation.name+' · '+ROLES.deviation.user, 'Deviation override — proceed', (partial?'Partial utilisation (available portion). ':'Full utilisation. ')+note));
  const from=c.stage; const to=nextStage(c);
  c.prevStage=from; c.stage=to||c.stage;
  toast('Override approved — '+(partial?'partial utilisation':'full utilisation'),'ok','⚖️');
  renderSidebar(); renderTopbar(); route();
}
function askReject(id){
  const c=findCase(id); if(!c) return;
  openModal(`<div class="modal-h"><div><h3>Reject request</h3><div class="mh-sub">${c.invoiceNo} · ${egp(c.amount)}</div></div><button class="x" onclick="closeModal()">✕</button></div>
    <div class="modal-b"><div class="fld"><label>Reason for rejection <span class="req">*</span></label><textarea id="rejReason" rows="3" placeholder="Explain why this request is being rejected…"></textarea></div>
    <div class="alert warn" style="margin-top:12px"><span class="ai">⚠️</span><div>The initiator will be notified. This action is recorded in the audit trail.</div></div></div>
    <div class="modal-f"><button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-danger" onclick="confirmReject('${id}')">Confirm rejection</button></div>`);
}
function confirmReject(id){
  const c=findCase(id); if(!c) return;
  const reason=(el('rejReason')&&el('rejReason').value)||'No reason provided';
  c.rejFrom=c.stage; c.stage='rejected'; c.notes=reason;
  c.audit.push(mkAudit(ROLES[state.role].name+' · '+ROLES[state.role].user,'Rejected at '+STAGE[c.rejFrom].label,reason));
  closeModal(); toast('Request rejected','err','✕'); renderSidebar(); renderTopbar(); route();
}
function ackEscrow(id){
  const c=findCase(id); if(!c) return;
  c.ackEscrow=true; c.audit.push(mkAudit(ROLES[state.role].name+' · '+ROLES[state.role].user,'Escrow acknowledgement signed','Silent factoring — collection via escrow confirmed'));
  toast('Escrow acknowledgement recorded','ok','🔐'); renderSidebar(); route();
}
function openSettle(id){
  const c=findCase(id); if(!c) return;
  openModal(`<div class="modal-h"><div><h3>Settle with bank</h3><div class="mh-sub">${c.invoiceNo} · ${egp(c.amount)}</div></div><button class="x" onclick="closeModal()">✕</button></div>
    <div class="modal-b">
      <div class="form-grid">${fld('Settlement bank','text',c.bank||'CIB')}${fld('Settlement date','date','')}${fld('Proof of payment ref','text','TRX-…')}${fld('Settled amount (EGP)','text',money(c.amount))}</div>
      <div class="section-title">Documents</div>
      <div class="dropzone" onclick="simulateUpload(this)" style="padding:18px"><div class="dz-ic" style="font-size:20px">⇪</div>Upload proof of payment / finance document<div class="upbar hidden" id="upDemo"><i style="width:0%"></i></div></div>
      <div class="alert info" style="margin-top:12px"><span class="ai">🔌</span><div>In production these documents auto-sync from the finance system API.</div></div>
    </div>
    <div class="modal-f"><button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-gold" onclick="confirmSettle('${id}')">Confirm settlement</button></div>`);
}
function confirmSettle(id){
  const c=findCase(id); if(!c) return;
  c.prevStage=c.stage; c.stage='settled';
  c.docs.push({n:'Proof of payment.pdf',t:'Settlement',sz:'104 KB'});
  c.audit.push(mkAudit(ROLES[state.role].name+' · '+ROLES[state.role].user,'Settled with bank','Proof of payment uploaded'));
  closeModal(); toast('Request settled','ok','💳'); renderSidebar(); renderTopbar(); route();
}
function addDoc(id){
  const c=findCase(id); if(!c) return;
  openModal(`<div class="modal-h"><div><h3>Upload document</h3><div class="mh-sub">${c.invoiceNo}</div></div><button class="x" onclick="closeModal()">✕</button></div>
    <div class="modal-b"><div class="fld"><label>Document type</label><select id="docType"><option>Commercial invoice</option><option>Delivery note</option><option>Purchase order</option><option>Proof of payment</option><option>Other</option></select></div>
      <div class="dropzone" onclick="simulateUpload(this)" style="margin-top:12px"><div class="dz-ic">⇪</div>Click to upload<div class="upbar hidden" id="upDemo"><i style="width:0%"></i></div></div></div>
    <div class="modal-f"><button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="confirmDoc('${id}')">Add document</button></div>`);
}
function confirmDoc(id){
  const c=findCase(id); if(!c) return;
  const ty=(el('docType')&&el('docType').value)||'Document';
  c.docs.push({n:ty+'.pdf',t:ty,sz:(80+Math.floor(Math.random()*180))+' KB'});
  c.audit.push(mkAudit(ROLES[state.role].name+' · '+ROLES[state.role].user,'Document uploaded',ty));
  closeModal(); toast('Document added','ok','📄'); if(state.view==='case'){state.tab='documents';route();}
}
function simulateUpload(zone){
  const bar=zone.querySelector('.upbar'); if(!bar) return; bar.classList.remove('hidden');
  const i=bar.querySelector('i'); let w=0; const t=setInterval(()=>{ w+=12+Math.random()*16; if(w>=100){w=100;clearInterval(t);toast('Upload complete','ok','✓');} i.style.width=w+'%'; },140);
}
function submitInvoice(kind){
  if(kind==='bulk'){ toast('Bulk invoices submitted for validation','ok','⇪'); go('invoices'); return; }
  // create a new case for the active client
  let buyerId,supplierId,initiator;
  if(state.role==='buyer'){ const b=myBuyer(); buyerId=b.id; supplierId=b.suppliers[0]; initiator='buyer'; }
  else if(state.role==='supplier'){ const s=mySupplier(); supplierId=s.id; buyerId=s.buyers[0]; initiator='supplier'; }
  else { buyerId=BUYERS[0].id; supplierId=SUPPLIERS[0].id; initiator='buyer'; }
  const b=findBuyer(buyerId), s=findSupplier(supplierId);
  const isReverseSupplier = initiator==='supplier' && s.model==='reverse';
  const nc=c(s.model, initiator, buyerId, supplierId, 1000000+Math.floor(Math.random()*3000000), 'INV-2026-0'+(490+Math.floor(Math.random()*99)), '2026-06-11','2026-08-10', isReverseSupplier?'pendingbuyer':'submitted', {recourse:s.model==='normal',disclosure:s.disclosure});
  cases.unshift(nc);
  if(!isReverseSupplier) autoFlow(nc);
  toast(isReverseSupplier?'Invoice submitted — pending buyer validation':'Invoice submitted — FRA e-invoice validation passed', isReverseSupplier?'warn':'ok', isReverseSupplier?'⏳':'🛡️');
  go('case', nc.id);
}

/* notification panel */
function renderNotifPanel(){
  const list=myNotifs();
  el('notifPanel').innerHTML=`<div class="notif-h">${t('notifications')}<button class="x" style="margin-inline-start:auto" onclick="toggleNotif()">✕</button></div>
    <div style="flex:1;overflow-y:auto;padding:12px">
      ${list.length?list.map(n=>`<div class="notif ${n.unread?'unread':''}"><div class="nic" style="background:${n.bg};color:${n.col}">${n.icon}</div><div style="flex:1"><b style="font-size:13px">${n.title}</b><p style="margin:3px 0 0;font-size:12px;color:var(--ink-soft)">${n.body}</p><div class="t-sub" style="margin-top:3px">${n.time}</div></div></div>`).join(''):'<div class="empty"><div class="ei">🔔</div><p>No notifications.</p></div>'}
    </div>
    <div style="padding:12px;border-top:1px solid var(--line)"><button class="btn btn-ghost btn-block" onclick="toggleNotif();go('notifications')">View all notifications</button></div>`;
}
function toggleNotif(){ state.notifOpen=!state.notifOpen; renderNotifPanel(); el('notifPanel').classList.toggle('open',state.notifOpen); }

/* ---------------- BOOT ---------------- */
function boot(){
  try{ const th=localStorage.getItem('cf.theme'); if(th) state.theme=th; }catch(e){}
  applyTheme();
  document.documentElement.dir = state.lang==='ar'?'rtl':'ltr';
  el('app').style.display='none';
  try{ const hp=(location.hash||'').replace('#',''); if(hp==='employee'||hp==='client'){ authState.portal=hp; authState.tab=hp==='employee'?'ops':'client'; } }catch(e){}
  renderAuth();
}

/* ===================== TWEAKS (appearance controls) ===================== */
var TW = { accent:'orange', density:'cozy', glass:'on' };
function twLoad(){ try{ var th=localStorage.getItem('cf.theme'); if(th)state.theme=th; ['accent','density','glass'].forEach(function(k){ var v=localStorage.getItem('cf.'+k); if(v)TW[k]=v; }); }catch(e){} }
function twApply(){ var d=document.documentElement; d.setAttribute('data-theme',state.theme); d.setAttribute('data-accent',TW.accent); d.setAttribute('data-density',TW.density); d.setAttribute('data-glass',TW.glass); }
applyTheme=function(){ twApply(); };
toggleTheme=function(){ state.theme=state.theme==='dark'?'light':'dark'; try{localStorage.setItem('cf.theme',state.theme);}catch(e){} twApply(); twRender(); if(el('topbar')&&el('app').style.display!=='none')renderTopbar(); toast(state.theme==='dark'?'Dark mode on':'Light mode on','brand',state.theme==='dark'?'🌙':'☀️'); };
function twCur(k){ return k==='theme'?state.theme:TW[k]; }
function twSet(k,v){ if(k==='theme'){ state.theme=v; try{localStorage.setItem('cf.theme',v);}catch(e){} } else { TW[k]=v; try{localStorage.setItem('cf.'+k,v);}catch(e){} } twApply(); twRender(); try{window.parent.postMessage({type:'__edit_mode_set_keys',edits:{}},'*');}catch(e){} if(el('topbar')&&el('app').style.display!=='none')renderTopbar(); }
function twPanelHtml(){
  var seg=function(k,opts){ return '<div class="tw-seg">'+opts.map(function(o){ return '<button class="'+(twCur(k)===o[0]?'on':'')+'" onclick="twSet(\''+k+'\',\''+o[0]+'\')">'+o[1]+'</button>'; }).join('')+'</div>'; };
  var sw=[['orange','#F6801F'],['azure','#2A6FDB'],['teal','#13998A'],['violet','#7A5AE0']];
  return '<div class="tw-head"><b>Tweaks</b><button class="tw-x" onclick="twDismiss()">✕</button></div>'
    +'<div class="tw-body">'
    +'<div class="tw-sec">Appearance</div>'
    +'<div class="tw-row"><span>Theme</span>'+seg('theme',[['light','Light'],['dark','Dark']])+'</div>'
    +'<div class="tw-row"><span>Accent</span><div class="tw-sw">'+sw.map(function(s){ return '<button class="'+(TW.accent===s[0]?'on':'')+'" style="background:'+s[1]+'" title="'+s[0]+'" onclick="twSet(\'accent\',\''+s[0]+'\')"></button>'; }).join('')+'</div></div>'
    +'<div class="tw-sec">Layout</div>'
    +'<div class="tw-row"><span>Density</span>'+seg('density',[['cozy','Cozy'],['compact','Compact']])+'</div>'
    +'<div class="tw-row"><span>Glass cards</span>'+seg('glass',[['on','On'],['off','Off']])+'</div>'
    +'</div>';
}
function twRender(){ var p=el('tweaksPanel'); if(p)p.innerHTML=twPanelHtml(); }
function twDismiss(){ var p=el('tweaksPanel'); if(p)p.classList.remove('open'); try{window.parent.postMessage({type:'__edit_mode_dismissed'},'*');}catch(e){} }
function buildTweaks(){
  if(el('tweaksPanel'))return;
  var p=document.createElement('div'); p.id='tweaksPanel'; p.className='tweaks-panel'; document.body.appendChild(p); twRender();
  window.addEventListener('message',function(e){ var ty=e&&e.data&&e.data.type; if(ty==='__activate_edit_mode'){p.classList.add('open');} else if(ty==='__deactivate_edit_mode'){p.classList.remove('open');} });
  try{window.parent.postMessage({type:'__edit_mode_available'},'*');}catch(e){}
}


/* ============================================================
   BOOTSTRAP — mount into the React-rendered DOM scaffold and expose
   the inline-handler functions on window.
   ============================================================ */
export function initFactoringPortal(){
  if (typeof window === 'undefined') return;
  Object.assign(window, { chainFor,nextStage,t,paOverall,paQueueFor,countProfile,mkAudit,c,countStage,pendingForBuyer,escrowPending,myBuyer,mySupplier,myCases,findCase,findBuyer,findSupplier,money,egp,egpC,mShort,nowStr,initials,colorFor,avatarStyle,myNotifs,badge,typeTag,discTag,party,pipeline,clientPipeline,caseTable,emptyState,stat,pageHead,tabBar,auditTimeline,limitBar,fld,fakeQR,qrCard,renderAuth,opsForm,clientForm,forgotFlow,authTab,authClient,authGo,togglePass,otpNext,startCountdown,resendOtp,doOps,sendOtp,verifyOtp,enterApp,logout,renderShell,renderSidebar,renderTopbar,profileMenu,togglePmenu,crumbsHtml,crumbsFor,setLang,applyTheme,toggleTheme,switchRole,toggleSidebar,go,goBack,openCase,quickSearch,globalSearch,route,wlBanner,shade,viewDashboard,greet,attentionList,quickCard,dashRM,dashBuyer,dashSupplier,swiftBlock,dashCredit,dashLegal,profileApprovalTable,viewProfileApprovals,viewProfileApprovalDetail,paToggleDoc,paAddComment,paDecide,dashFRA,dashDeviation,dashFinance,dashAdmin,viewBuyers,viewBuyerDetail,viewSuppliers,viewSupplierDetail,viewProfileForm,submitProfile,viewSupplierLinking,allocFor,buyerConcStatus,buyerAlertStatus,riskTag,viewLimits,viewLimitDetail,viewFactoring,viewInvoices,viewInvoiceNew,viewInvoiceBulk,viewCase,caseActionPanel,caseActions,stageHint,docManager,validationPanel,viewPendingValidation,viewFRA,viewDeviation,viewDeviationDetail,viewCredit,viewApprovals,viewFinance,viewSettlements,viewFinancing,viewEscrowAck,viewDocuments,viewUsers,viewPermissions,viewSitemap,viewWorkflow,viewAudit,viewReports,viewNotifications,saveProfileName,viewSettings,viewSearch,toast,openModal,closeModal,transitionLabel,autoFlow,advanceCase,setUtil,overrideCase,askReject,confirmReject,ackEscrow,openSettle,confirmSettle,addDoc,confirmDoc,simulateUpload,submitInvoice,renderNotifPanel,toggleNotif,boot,twLoad,twApply,twCur,twSet,twPanelHtml,twRender,twDismiss,buildTweaks,setPortal,demoLogin,demoPanel,paResubmit, state, authState, STAGE, ROLES, NAV, I18N, BUYERS, SUPPLIERS, cases, notifications, PROFILE_APPROVALS });
  try { twLoad(); twApply(); buildTweaks(); } catch(e) {}
  boot();
}
