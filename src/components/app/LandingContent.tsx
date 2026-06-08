import { useState } from "react";
import Icon from "@/components/ui/icon";

const IMG_APP_MOCKUP =
  "https://cdn.poehali.dev/projects/4402d97e-15af-4062-b89e-5d5fc4618802/files/b1612dd1-30dd-4885-8a42-061117d607be.jpg";
const IMG_HOW_IT_WORKS =
  "https://cdn.poehali.dev/projects/4402d97e-15af-4062-b89e-5d5fc4618802/files/b4993608-f277-4eb3-8c0f-218ff8c083cd.jpg";
const IMG_PROBLEM =
  "https://cdn.poehali.dev/projects/4402d97e-15af-4062-b89e-5d5fc4618802/files/838a191a-1e94-4979-ac98-eab3e17124fb.jpg";

const STEPS = [
  {
    num: "01",
    icon: "FileText",
    title: "Напишите отзыв",
    desc: "Опишите свой опыт — что купили, что пошло не так, как отреагировал продавец.",
  },
  {
    num: "02",
    icon: "Image",
    title: "Прикрепите доказательства",
    desc: "Скриншот отклонённого отзыва из личного кабинета и фото товара. Можно замазать личные данные прямо в приложении.",
  },
  {
    num: "03",
    icon: "ShieldCheck",
    title: "Модерация за 24–48 ч",
    desc: "Команда проверяет отзыв на подлинность и публикует его. Отзыв остаётся здесь навсегда.",
  },
];

const FEATURES = [
  {
    icon: "Lock",
    title: "Анонимность",
    desc: "Можно публиковать без имени — маркетплейс не узнает кто написал.",
  },
  {
    icon: "ShieldOff",
    title: "Не удалить",
    desc: "Отзывы хранятся на независимой платформе, вне досягаемости продавца.",
  },
  {
    icon: "Search",
    title: "Поиск по товару",
    desc: "Любой покупатель найдёт отзывы по артикулу или ссылке на товар.",
  },
  {
    icon: "MessageSquare",
    title: "Честная модерация",
    desc: "Публикуем только реальные отзывы с подтверждёнными фактами.",
  },
  {
    icon: "Smartphone",
    title: "Работает как приложение",
    desc: "Установите на телефон — работает без браузера, уведомляет о статусе.",
  },
  {
    icon: "Star",
    title: "Бесплатно",
    desc: "Публикация отзывов абсолютно бесплатна для покупателей.",
  },
];

const FAQ = [
  {
    q: "Сколько стоит публикация отзыва?",
    a: "Абсолютно бесплатно. Платформа существует ради защиты прав покупателей, а не ради прибыли.",
  },
  {
    q: "Какие отзывы вы публикуете?",
    a: "Только реальные отзывы о товарах и продавцах на маркетплейсах — Wildberries & Ozon. Каждый отзыв проходит проверку.",
  },
  {
    q: "Что будет, если продавец потребует удалить отзыв?",
    a: "Ничего. Отзывы размещаются на независимой платформе, которая не зависит от маркетплейсов и продавцов.",
  },
  {
    q: "Как долго проходит модерация?",
    a: "Обычно 24–48 часов в рабочие дни. Вы получите уведомление о результате.",
  },
  {
    q: "Можно ли опубликовать анонимно?",
    a: "Да. При создании отзыва есть чекбокс «Опубликовать анонимно» — тогда ваше имя и фото не будут отображаться.",
  },
  {
    q: "Что делать, если отзыв отклонили?",
    a: "Модератор укажет причину. Вы сможете исправить отзыв и отправить повторно прямо из личного кабинета.",
  },
  {
    q: "Мои данные в безопасности?",
    a: "Да. Мы не передаём ваши данные третьим лицам. Вход через Google, Яндекс или Telegram — без паролей.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        className="w-full flex items-center justify-between gap-3 py-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-medium text-gray-800">{q}</span>
        <Icon
          name="ChevronDown"
          className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="pb-4 text-sm text-muted-foreground leading-relaxed">
          {a}
        </p>
      )}
    </div>
  );
}

interface LandingContentProps {
  onLoginClick: () => void;
}

export function LandingContent({ onLoginClick }: LandingContentProps) {
  return (
    <div className="w-full">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="py-10 md:py-14">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
            <Icon name="Megaphone" className="w-3.5 h-3.5" />
            Ваш голос не заглушить
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4 text-gray-900">
          Отзыв удалили?
          <br />
          <span className="gradient-text">Мы его опубликуем.</span>
        </h1>
        <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed max-w-lg">
          BANa.NET — независимая платформа честных отзывов о товарах и продавцах
          маркетплейсов. Ни Wildberries, ни Ozon не могут удалить отзыв здесь.
        </p>
        <button
          onClick={onLoginClick}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-bg text-white font-semibold text-base shadow-lg hover:opacity-90 transition-opacity"
        >
          <Icon name="LogIn" className="w-5 h-5" />
          Опубликовать отзыв бесплатно
        </button>
        <p className="mt-3 text-xs text-muted-foreground">
          Нет аккаунта — создастся автоматически при первом входе
        </p>

        <div className="mt-8 rounded-2xl overflow-hidden shadow-xl border border-gray-100">
          <img
            src={IMG_APP_MOCKUP}
            alt="Приложение BANa.NET"
            className="w-full object-cover"
          />
        </div>
      </section>

      {/* ── ПРОБЛЕМА ─────────────────────────────────────────── */}
      <section className="py-10 border-t border-gray-100">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-destructive mb-3 block">
              Проблема
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">
              Маркетплейсы удаляют
              <br />
              неудобные отзывы
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Тысячи честных отзывов о бракованных товарах и недобросовестных
              продавцах исчезают каждый день — по жалобе продавца или алгоритму
              платформы.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Другие покупатели не видят реальную картину и снова попадаются на
              тот же товар.
              <strong className="text-gray-800"> Это несправедливо.</strong>
            </p>
          </div>
          <div className="flex-shrink-0 w-full md:w-64">
            <img
              src={IMG_PROBLEM}
              alt="Отзыв заблокирован"
              className="w-full rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* ── КАК ЭТО РАБОТАЕТ ─────────────────────────────────── */}
      <section className="py-10 border-t border-gray-100">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-3 block">
          Как это работает
        </span>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          3 простых шага
        </h2>
        <p className="text-muted-foreground mb-8">
          Весь процесс занимает около 5 минут
        </p>

        <div className="space-y-5">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className="flex gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                <Icon
                  name={step.icon as Parameters<typeof Icon>[0]["name"]}
                  className="w-5 h-5 text-white"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-primary/60">
                    {step.num}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {step.title}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl overflow-hidden shadow-lg border border-gray-100">
          <img
            src={IMG_HOW_IT_WORKS}
            alt="Как работает платформа"
            className="w-full object-cover"
          />
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onLoginClick}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-bg text-white font-semibold text-sm shadow hover:opacity-90 transition-opacity"
          >
            <Icon name="ArrowRight" className="w-4 h-4" />
            Попробовать — это бесплатно
          </button>
        </div>
      </section>

      {/* ── ПРЕИМУЩЕСТВА ─────────────────────────────────────── */}
      <section className="py-10 border-t border-gray-100">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-3 block">
          Преимущества
        </span>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
          Почему BANa.NET
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex gap-3 p-4 rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon
                  name={f.icon as Parameters<typeof Icon>[0]["name"]}
                  className="w-4.5 h-4.5 text-primary"
                />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900 mb-0.5">
                  {f.title}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── СТАТИСТИКА ───────────────────────────────────────── */}
      <section className="py-10 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { val: "100%", label: "бесплатно" },
            { val: "24–48ч", label: "модерация" },
            { val: "∞", label: "хранение" },
          ].map((s) => (
            <div
              key={s.label}
              className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10"
            >
              <p className="text-2xl md:text-3xl font-bold gradient-text">
                {s.val}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="py-10 border-t border-gray-100">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-3 block">
          FAQ
        </span>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          Частые вопросы
        </h2>
        <div className="rounded-xl border border-gray-100 px-4 divide-y divide-gray-100">
          {FAQ.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      {/* ── ФИНАЛЬНЫЙ CTA ────────────────────────────────────── */}
      <section className="py-10 border-t border-gray-100">
        <div className="rounded-2xl gradient-bg p-8 text-center text-white">
          <Icon
            name="Megaphone"
            className="w-10 h-10 mx-auto mb-4 opacity-90"
          />
          <h2 className="text-2xl font-bold mb-2">Ваш отзыв важен</h2>
          <p className="text-white/80 text-sm mb-6 max-w-sm mx-auto">
            Помогите другим покупателям принять правильное решение. Опубликуйте
            честный отзыв прямо сейчас.
          </p>
          <button
            onClick={onLoginClick}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-white text-primary font-bold text-sm shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            <Icon name="LogIn" className="w-4 h-4" />
            Войти и опубликовать
          </button>
        </div>
      </section>

      {/* Отступ снизу */}
      <div className="h-8" />
    </div>
  );
}
