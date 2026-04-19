import { useTranslations } from "next-intl"
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
  } from "lucide-react"
  
  import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
  } from "@/components/ui/command"
  
  export function SearchCommond() {
    const tShell = useTranslations("shell")

    return (
      <Command className="rounded-lg border shadow-md md:min-w-[450px] w-[500px] mx-auto hidden lg:block">
        <CommandInput placeholder={tShell("search.placeholder")} />
        <CommandList>
          <CommandEmpty>{tShell("search.empty")}</CommandEmpty>
          <CommandGroup heading={tShell("search.groups.suggestions")}>
            <CommandItem>
              <Calendar />
              <span>{tShell("search.items.calendar")}</span>
            </CommandItem>
            <CommandItem>
              <Smile />
              <span>{tShell("search.items.searchEmoji")}</span>
            </CommandItem>
            <CommandItem disabled>
              <Calculator />
              <span>{tShell("search.items.calculator")}</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading={tShell("search.groups.settings")}>
            <CommandItem>
              <User />
              <span>{tShell("search.items.profile")}</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <CreditCard />
              <span>{tShell("search.items.billing")}</span>
              <CommandShortcut>⌘B</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <Settings />
              <span>{tShell("search.items.settings")}</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    )
  }
  
