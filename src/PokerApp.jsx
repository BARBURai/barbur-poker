import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Trophy, Upload, Users, TrendingUp, Calendar, Plus, X, Check, AlertCircle, Loader2, Download, RefreshCw, Crown, Skull, Flame, Target, HelpCircle, Maximize2, Filter, LayoutDashboard, Table, BarChart3, History, ChevronDown, ChevronLeft, ChevronRight, Lock, LogOut, Quote, Heart, Search, Trash2, MessageSquare, Sparkles, Image as ImageIcon, Camera } from 'lucide-react';
import { loadState as fbLoadState, saveState as fbSaveState } from './firebase';

// ===== הרשאות מנהל =====
const ADMIN_PASSWORD = 'barbur2026'; // סיסמה זמנית - להחליף בסיסמה האמיתית
const ADMIN_NAMES = ['רון', 'גילי'];

// ===== לוגו BarburAI (Base64) =====
const BARBUR_LOGO = "data:image/webp;base64,UklGRjIlAABXRUJQVlA4WAoAAAAQAAAAxwAAxwAAQUxQSAQOAAABwIZt2zKnte5XIlhKsLq7O9IiVXRRd3dF6tTd3Wh33d3d3QXq7qVUUlaQBYHJ+z7P/WMmmW++b+bbvndETAD+3///U66xzhmT+6w3KOm8NfnNOAug50r9N+hrAMCbfGYdgJVPfnNGJGd9ce/4DQzgTf4yDui767MFklRl8UdHNgPe5CwHrHNDC8kQVUmVGJT87aQ+gM1VDn2uiGSMys5KIH8/oQk+R3nsPI0MyrI1kN8Nhs9NHtuSgclqYGF/+JzkMHZuiExclLvD5SJrlv2ekUmKipKUOHdV2BxkrHuTgYkLycgP65zJPx67MDDZj6d9OZsaRQNPg8s/pu5TjYkItxu43pC3SVJCYTW4vOPMIAoTDbwVMN3WufyLaVS+aPMP7mNMhiq3bLTkIqgbs+0N/1LuBp9vHDaMwqSFf2y37ZhhO+00dtIv/KLemlxj8TZjYizoZVvtMXTEiG222+VhXgeXZxz6izB54fRhfdFr27GLuo1/4QS4HGPtc4wVoHAMYEfu+MJYd/RvXBY2txj0mEWtRNSJjav03OB7ToJd5+x1aof13nlv0+TNPhJZycAzmrdf4Q3Gx00d0IjaaJxFaWfS4/AYQ4UmN67yEdv50hIwqInGOQDLHnDtndcftQJg0mLQ75/UCp2BJ9keedikvbpYU/2sB9B990fbWDz3ym4wKXHYjMKyVUQ7UG1bY0cGRp67O/c2vspZbwAz+IZfSIZi8o3u1qbD42INZQlJaghRlMof1pSojHxrgDwNW82McwDWPv0jkjEqi3UB74JLh8PdLEsZvv2shSVju8xb5iO2U3XW2lPi4sZWK+McgCXHvS6kRmEnAzeDS4XxX1LKiHx45Xr0HHDoxS9MU5Jz69f6i4GRp/dpOwG+OlkPoGnbh2aTDMLOB300HRYrFpRlqqwBi5JdV9/ukm94AVZ6n4HKd+a0NFlTfaw3gB185TSSMSrLVc7qA1MRY4x1tg7jGMoQ/thgjTHOewsAjfu1XNnQ4x0GKoUXw1cZ4yyAtU76iKREZZKBhxpfnjHWOe+9twYlrTuhrMjXYFDaWOeB3qfsvXDvlxgoGgvrw1UR4xyAZca9rqQGZcKRr8IWGWOd8957Zww629DcZ83+K3THPmUF3gzfQbHxQEPPRbvdwXZS+OvCxlYL6wH02eORuSSDMHnV+cv7em8NOt3UZ83+ow465MrrX3zvx9ZZZOHX865lLOuGMgDjANen1zMMysiXnTfVwHoD1A2d/AfJGJUVDTwVxb55sf4Ddzto4r/d9c6UllnsvDLJwIvKAmBgll7pDjIy8ALUZc44B2DDM74kGaOy0sKfjr7uuhfe+6Z1LjutEkIIMYoqqRI1gf2SKO651IkzKBK4P3ymjHMAlhz3NkkNynSrxhBCiKLKygvHwCWDxubtXyODFAbBZcd6AE27PzSbZBCmVUMIMYoqU606ICkDv1zT2N/Zzl/6GZMF670D4Le4aRrJKKzyyj+7wyRTXI91P+A8XgqfPmtRvM5pX5KMUVn1A++GQ+IG9b23+4o8JX3GAWscdu1dn5KUoKyFgdf6Ru+ds8YkULzoKqe+shhsuqwH1n0gsDgIa2TgYejYGO9Neem3HkCfCwtkCEGUNVP58XWXHHzgZv2Xa25CsSvLWGdNeoyzANa5/A8yslYXWlumvH3bAf1gykmzcQ7Asoe9r2RU1l4JIQRRlv57PKzJhvUAFt7jkTaSQdlJ1ZrRoapKDJGcDJcB6wH4ETfNIBmF5cZCbelQCzwcLmXGWQDrnP81yRiVnVb548INrpkfaxFF/l4IJkXGOQDLjXtXSQnKsnXBK+uvRqlJjDwEPjXWAei1xyNtJIMwQeVvH36ElxlrUtBb02I9gIYxN/1OMgqTFX78NVcfSsmOapZ4L1wKjLMABlz+LckYlUkLH/h5+pWYwpgZMkbNzi3wKQCw4knvk5SgrGQ47JHnP+k7nJIR5azZzG7gBalYbN+XFpAMwooqv7uR5FX4TGM2GOedu/fDs1SzcnAqZpMMwkoHvf1+LcS5fcdQsyH87EGc0haYTeFIuBQwRmXlI8d9TAm8AE8VYhZUW2+dv+iZzIrKWqlQplHl9zW/oMj0xyY8NE2zEHl/K1fcLSvK2X1hUsB0zP/hvdlUFpjRyEcmfDFnxT2zM73J2irRSQ1RMyD84bSfXn9piRGM2Yh8F4D3tjqoqMagzOo+P5IcuxI1G6p/jl/TA4D3NnsdaiYWzD34bLYX5MDe7dRMFOvXN+y3PAAY70zGlPLYDf+ipk91xgObTAkSONnOyYwGkix8cs2uywGA9c5kKOrBwAZzVFNX8teghZmn43tKRkiVEEly/pvnj+0HANY7kw3l39414LnYngUlqfL7A/ve96+YmWKVEElyxrPnj+4LAM5lgcJBsN2/Y0aVJefMY+Y1hkiSM147dbOFAGPSp3z9MIuFR+3TQs1CDEqNkVVSYxCSnP7QWMCmLfJCwBgA26mkT4WltUoUawxC8snFYFKmXN03WqBr/RLt1LQp+fJRv1NYdTVGfr+YtekSjgKwUl/gLEamXDlvL+Af1YhkgU8gbfr9VutdMPSs826hMuUqC7aEr8cbjNWIMa4Jm6qS3zQOJ5VpjzwW9fBmIkNVCjwDPmUStWVGa3tk2oW/dHEGDkMpVepJ2JRlNnAyGmAd1qdWqcfg0qeqGRD9oDvq4TGSsUpdDZ++jCo/u3fr0cCjVSpyx5rBwBvw1tT3WZ2Vfy8EUysYXrn4eVKrU+BjcCit1a9YhNVqHHwHrIEShFW7sCxsBzOoVa+KR061Bh1exJjfAs+E72jNduZ31fXhOsJTGvOacFpXmE5sy9wW9GY4dGy6TaPkNOFY+E54XMyQz5Qz+8J0wmLVguazwBdg0VmHxxly2jjjy9ickseU85eG7RSseVdjDot8DRad99iXeSzwKPgyjGn6XSV3KecvDVsGPE5iyF2Rr8KiXGOaW1Ty1z7wZcHjJIacpWxbDLY8Y5qmq9QqjSFIBoI+CocEPQ5grEkaA4slfZE7widhbP13KrVHAsn5b51/6PcMaRNO7w6TBBx2ZKw1EskFL45fHsAiHzKkLPACeCTr8BJjjSF/On8VAMbXoeklhnRp+8qw5biO1ihErSWqnx3UHbDeArDo8iZDmgKfhEPZ1hbB4QKGGiJ6J4B6i9IOPT9hTJFw8wQGAdYCMK7hC0rtoM57bhTgbCk4LPM7JTVR3zAWZfPB/oCzgMN6ErV2FD+/EeBLwWOjQtTU8B/w5Sl57zqAs3A4nO21JAp5zzIwtgTqcABDSiLfdRblM5Jx8sqAcx7Xs72GkFE5c7yFLwGPaxnTsilcEmQk59++BmAa3O1s1xpCRvK1leFMkXENX1PSEPggHBIUkhrJcPdQALibIrWEGjjrAMABgMMQiVo5lbnLGJsElSQ1kpxyyjCPSaTWEjKSD/SFBwCPaxgq18494ZDk91QWa1SSn1+8ev/XRWsKNfK7wXAGsLZXi0ql2nk1PBId/BWliKQEJXnXRbHGkIHhWMABHicxVEj5BJxJ5q8Zoh2QlMCaLMoH+8LDmj4zVakSJSkp3OitQbKjW9gpkjHWIGrgdxvDG4d7GJTJC38BLJJebopq52p14Pz9YeowfIGw7Ysbr1hATYKRuxufVAOOju15gEJe4NCAG8NfB44dPfxTSkJTjUnK25Mokgeoka+vChzFh8bstfcWdzMmQo1rwCUE608ODHmADJx3av0aJw9Ydul+jbslFXgRfFIwGPwdJRcwkp8MQ8kNqckIf+0KkxQ8et3KmAuogbxzJaDBDUiKwlFwicEBkxlyASnCuZesAAygJBR4SyVgXeO3jPmAjOTcmza5hDEh4c91MMnBYZ3ZlJxADayo6MZwFYDDpm2UnEBqEE0u8DT4SsBjswUqeaGykc/DVgR12CqI5iDhtC4wFUEdttao+YcMK8NWBnU4lEHzj3Ar+AqhDscz5J/AcZWDx9Vsz0GTUmA87mT49wCMdS8y5J7j0wBren7IkHfGpQIOS//OmHMOTgccVv+dIc9EbguXCjisPo0hxzCuBpsOOCz+MqPmFeVvXWFSAgd7OVVySuQbMEitNdgvMOaTwGvg0wPjMXQ6Qy6J3CVVgMey7zHkEOWsvjCpgkfPx6hR80bQx+CQcgdcqqRovhCOTh+swY4vzCVjjKqaE6J+7gzSbwz6bH3rApYUoYpKrWvnVnAZACxgB55+6+2thdlkJMkQRaKWUK0xKrGdz8Eim8YAQPf1xu7x6ZS7prx71YcsGUOkskaqSgwhiJLky802K4CxzgIwjT0ae/Rcct3zn3rj6OcLLP7nN6rVSjXGUFKUHc/+/LZRFgaZNtag8yvtc+XTsz+68AWNWlpERSRGUdFiUjOgqhJDCCEqOz2v9bs37pl8yBYbLAwABtk3Ja2zsACww/cn7H7XLCoTViVVRGJIVkRiKI5BRCSKqCo7vWD6ey/efdcNV0zab/jAJXp5dOicQTU1MM43nXrZUuMfnPI729vmtba2fvNj6+eff/nm89Nbf2xpa2ubTwrTP6e1Zco7995w9lF7D16mBzpvnffOGYNq3di1z0JrLL/E4s3Nza6hGTBAt+b65qWWXHLp/husslb/ISO3HHvE8ZMmTZp0/DHnXXrM8cccNGHCvvsfe+TeIwYP2v2gAw86aM/t99ty+PARu4zYcmD//mv2a25CJ411znvvnbPGoKoba1C+sci6Mc577501qK3GGGutNR0DxhhjrbXOWeuKfbLOOV/Seeec867YGmPw//7/D3VWUDggCBcAABBlAJ0BKsgAyAA+USSPRaOiIRG6Pnw4BQSzt3GgE7AEK9VU6V5V87PpJ3DHmA/Xj1lvRb5LnWGegB+sfpu+xR+5H7kfAJ+uGYPfhn+oHy38LvxH5Cftx62+UT4B7i8t/rruOfufPrwX+Y+od+O/0T/X+ltF16N/Yf8/yjPrf+3/OH3ne4vpx9l/9j7gX8z/p/+v8rL9K/NI++/6n2Av5T/Xv9n9wnyc/7X+f/M73SfoP+M/7P+c+AX+Sf0j/c/3v98P8////qq9gH7Tew/+l50OqNOc5znOc5znOc5OvpSwvTVN1rvpznOcxuevIDJEyJR7DiAg/1TROHHwdJeDtduzfxMEqc5B7DRHVQmlcH/+qP8HIM6z4pok7h5kZVykf/mv+aP4E1vsTwGV+BvzRA22yEApyips+rrzrqahYU3MW60X+X4T4Z/1Qt7Q2RYuGdoMVCOcMu7ISX78EtPeDFZW4xDt7HxqpLBmUbTAAgFZ9GNsX+1qZgcgXaTdoxq5jdqNvXoan/PJ4XRSG3E+49PIzozkibnoVohRBILOKOmwhTPZKEIK8WIBKBjByybFpoXGhwOtl2LJuKxanIJGOsxlD/c9XqvHnYTtumKC5mc9IifaeM3pdbQAWmWDBLUXbgR844GqeXDiy/eBbrEoEwnRKixBtD7wxJHOpmIkQyyuyYrAHII7Hg8omq1KOcP89iMtavMKDKoFBuT5PB2qMasm9a8/o4l7PiCpHxEPAXav+j+GqcKJ79JSLlW54FuwoKvTo668+8Labl//qjfsPYp5PUcSssSfGIHzarzjHxSvmr/snO4A3aVhaAyrKnOSMBIheOC3yZ+6M4xEVUixAxEgMCX0LxyjJBWE8grc6gWKsUTyX58d2HTGVN9v4ITGoknlOhQzrN4DHOGCbcaPX5oMcM7vYUJ12SN0SVik+39CY35TOSw9JxYuq94bX61eLuqxaeisctbOylJCeqZ6oDlbQESvjWE59xFqL4TcPGGsRA+03+UQEULBSi2C+vk9NXzYKfVSYPHhH77w04dL/1WJQjvzXN2S7pdGNy+ZHDinGtb59Nd8sB9Oc5znOc5ziAAA/v4G0AAAAGr+eLBhpeegYHx+7tLlQ1nBLo/W6Nu2BNHCxyR0naWPrqs6cV89ru9m3BQJ1zs0V+Maz1FYlFfaWx32CWiDXkdOdvSKHkaUzJa/EDS58Za0nQGRONzCt7sFNAsyTNRNDA/VZZSfcKfR9kfIIf6YixfYHoAPn5xYB7QAuW6OFxnDgghT009RT66Czdt0+JPaO7T3pElcmz9E3Uu9KzluwWIIJskGMhaP4dp2Vf4OU3NL3rxlTm0xIq01uM/PZvyUobH2TygEWKvfxJaafgdum8038YBQ3xL5JGzINQlCsZQ8pnY+SB00H/ihG5yE+A9ZOniG4EBIqO1wktAlRfw6u+vkvIh9nmuDj9dPrtse22EXlPCfVzh18sFireCfWOdLPDDM+r31i8hYQzTLJbhLSGARMytM97rjTwmNYcgv1YV+pRFjKoS1bfBWamWQVc565/AJIhTUZ0LV12j4LcWANhWIXatTcXCFBR1Snj+B8xOYzmBtaLaiB0DfEFaHTcdU6DLHg2rB0bAt/y0u8HtDb8DmxShzPQPMouxKFuzMlWP5TvGZTyOYRlfjrv+ThDM+eFyVtrnf9AAGOPG+B5dK0sQyv9NSPf4OoZXZ9XSVD6CUnKQqI17qIovMCquBVFA/B+No41ZSZqayj1UXzaOm/H/eTkS53JUe16Zhu/JTBBwOIM2ZPK2g8ijkH926CctAq59g/NY90Fay+LLl/h1xX8IDVsP/V87yy4Rw06+oIZ0nyH237aKwfiI+LTMfjg1IZURtRBolGtjnCfAb96t4G2aIcCNICfqJqPFiQVQ7TnrcVXaRBNLnrJtj39nd9e+/nQOSxpQF08k6rormkDRU6EQ33jB0OBPELqVD1lBOx/YJRB1tcPNIq9aIJDP954CwxR4c8DHJdeno1MMJuvxXYLHp+/tRXf+o5q7n/Mp+jutOxli8nlqBDjh6R8ic8eLZ+S39qtyl9q1qZ0HzVcMsnLDg0WX+xYgpi79dUIpO3hiGVQU2Q8+QhI13ZIzNOIJkbbfxu7aCdHvEkgU8d5o6KkiT4zgkofuhnasVJW6jNFzckPanH5DlttUwf2kSE0PDdJUhc3Bg5Gqd65QRqTuznoE0ykPxmF4tIiLCtGa1PdVT+wfI4T9tRETGpBVx2PEk/EVI57I2YyY3l5e8Ox7neg6df/v2ZDVfbnF0ng+UH6DfB2/HBEvGqqK9xrnfAPObGVB9W0wKwtdkGKmOEd9V1De67rKQd1YLfrQV491oaSQ9kHs1Q0YDPHjTKjr7mqe3sfjY0FwiTvlmlfwx74w6BZ657LySRz4dMpHXaZNOUFsIqK1v7Alk1pfOtKlj+mq6vvo3mulzs5nTdDWOoeFCX6zLqNF5J2C2wsMYWr71bZK0DaNEZFVCWbX+0ptVqSeo72lty3AAhiHaOUNQuwsyRFvsauW6zZBP/2XhrfIn99bq71ELePwVE2jQb/zD1HVQ8Noauw5yLDXXc4kjRspv0PuAvIwC44+FfGz0mscoCCfg3hHfzn6VQ/G01Z8H41MRmyjoSsM2OSVMTwi1HRF3iY5rDoTo0G6eX69zwTjTJ1R4fHhbsFpiOTabEImPP/zr8KcnfJc0T+GSjr/iYdUWoD9H8of4/XcLAkbklYcDSeHmnqjlDJ5CvHN0QetHMrTW4berJBY3IJBKcjMWeihti6kHji+lYaboVcF2KiPLnewVwo4e4ITZlNSeVUVwH95zQzmVi96X9SfsswiXpavg/YcFCBy4kqEWG6Ia3bsvebd4/2JOvC+gJksNPc4ALm1rBwtx8Hy+oX9oTIuARdEI57c3M5i4QMczpshMUYf8r3iOcksqxG2q3OsOuNF2cR/74e6XnzNdhmVkgEE+QqKxpYj7w2h12J7/6MMg5+QAkCUF71DSuJr9K8wd68Kkffdv+lWLEr3rbN/jG4eRQ6dWC+KU1iGdr6iYPu4WAbPq7QU5vkatuG6H6XTPxttt3ogvXJ8blsm0g6I5BPe60OPnFK2QNEkYBvkT0E8fD/OCOOEiVQIGioa9GxIJNcYcfLbXYu7A48bq5UF3FPLVFaVrN4ioZ8AXeFi0AuqTNF8FmoQ8nVpHEvkReGdKtNYPlxuWxTBvHHE7rZ0Trmk17W2V9yczSIS3kV07Oh9ZkzXOyMyYCac9X8pqQfl/LiM9mKyulgedKjdOWZN9qqlmNrT2o4alRyfRyidFQnBb4moG2sVwzO4VNhpv7Kgc9f6o9SbnPi4moZ/PMR0bGtfUup4kd2VuOZcvzhA8QSlzTtOdmKrzHIbxXFMgsIckVZNoY34C+KbTPsfCoGBus57yoW2Yy5xrBIJjbKQyu6XderROf7O6GL1GYA7C6QFR4WGcVHnI/DULFH2+a/lCAPI29zCEWSbpz6Zi2GdhXkVBNLWutVvtdOj72hkw5EYJPqGOgb+zi9q/86qSp+GPED0j6roi8Pm9GP+dGJxJueat89QYNvy9MDLimh+tjZ2TFtxTb9DGvsk/COXDs01WXC7AiCGQm/r22670SKAoSRT7ohoy+zyc9a7ZGj6/NPaT/g3qsuflYQ+An+I8Qwx4thUOyuzKQ4ifY+LVUnptNOAvwkRE41pmJe+gZf9rWmwVqmoNs4ocL6Z3eridRp3mo3+5K0rzNPNkpZ+DtNQvWcpbLkFy4K27O+1T+hjiVZkZFqwJ5hLC3y/YjxxBGNCPHzZEbuRFYZ95GXzlW1s7Z4Sil7ki+yFMBffqAUgzYNw9gkiCRYTLP/2d/jF9u8krb9qWA9S9cMf3X/388Qh5iLWnvqhVrcNwVj/pvwxAsQnr51r34SgZPd5G+08Qn7FKWZXENrzGfWlF5Y4vNd2Af+QAcSlWANr+GRDa7nR/8dR1iwY2MvP78gC8tH8bPL7WeHWd64+TCI8xsPjTt9DJB6sXbwvuNXpElSyacP+OIAjZVwJ/+tUIqLUlPTmH6KG/7j70TPsjEdAdOAgf9auiqiShUxGyPPyU3J2k/X6jLL6w8JH84Ksp0EPvSKEOcyH/KKyHFVgJ2BsmNnpzsCWcMzo0esYNrB8P47teJDmxHWrsaqs0plrU0Gh3kUiuJvq2wQq17rprs/Ek3ArqWJ4rCFkf0jyOIm6npbZEJC6AIb6aMBTFgJFfhOORwnx8eoS2XhznYIm/ynFnazcmurvLKQTXgaJCAdnI2f/5muKPHvnf11+fLYBTFJwrTvDIlS1FHcGH6b5N5///eJ+z9/63vttGN0a8e2/yPA+Vp8RD5C+QI0GnG26f8Pf8zMwXgfr8TnW0b5wCdArN9i4+ebuCH7RreyX8NIoCc+ojOSVauLZX7NJyHpf8t7z34XUp9YKomId8gpGOv6zr/8xnnM7rapzTsQJ2N/+zcxk/poXC3hi0Vp4q+PIvWzn3j1MsTo8YEtDis9qJceqeHD1UiweNEfcBjQAMX0sfbn+cCMtIJay+YveJTHDCKUNJGTRL8FsjLR+PpUjpgXyFkrObYdc/p+XnsWp2gx0VtuEp1L4X0brIl8TCqpR76B+HL8PQaMT4iBp0AMOW3EJB7lvu2hldlp7oR1ETHvSe3eo6GRbarjSYfXQTzJnUaDnPtkV0v/pNbul/KRlJhuc8krXzRRQxyKYMihFRJGkZdKps1Vl91dQ+FQiXdQyaI8gmT+wWS53j9tmnzHtlfBl9NE/YD7ffrqirKaS+QeEFLJwndtCiBgdQ2shHOLBH9sG7dsp6Js/NMgcG+eh8SkPtl1+Bjmoo448p34IujJKr8hktxR04V+Ye1pSb5xo0KdFjNfD8puELtpqOgj/4oe///3hHl9BqFPq7fp9kpRpI+HXE5+NCdRj9Hfn4W0bq2uJ36ggrudIiO2tboRGcFGr0BRh+RG5PAkLyHPC9bVlwzw7IjbvIFsgB/O/xFF+pTTuwSw1U1tr1jTFu6KHisGO9a/QQzUR1JMcgdoWQYdg4l3ESYK6jcaRE+vmgSXmGLoFH2ODdtM6xPEVNnN3uwg5iA6Q67u8wglMYK89W9930VJKy3UZfDDM1fJS+E5eWC+b688T5gHlmEEZAqAD7kwj2Ql01SBJXLPJbGF8sjbo9m1KUJ39rUSrl9YRV9lLBqRR1hce2WN0vLpXtjyGffujAkM11XZuCjAfREWG1Tt8gaSoL8zitdNo3c0JP6bb82UM+BDJCKZnWtYXLkPLi+okt2G+J8CbOC9g3a5ScYF93HkevERs9/EoCzmfMT+j8pBMImD84aDZ/j+6iF/0f12i/oVU3iXdsqjmg5p9jU3e8caBB8CM8qDwn+8eUwR6XN8+wZ9UB5NVGzsO0+np38UWg+kx0r0UKyddTnwpiiGD9miBjuqdGd/ihDi6EKnqzW+RFbDXO4ykoUe46PoosQHmxX5qYUsa3uRMj+Tdhc0h4fQxVm8J3Yh8eLC/X2/rFmNQuvmRTxUrexSJxqz1UMv4n8XY6bkTWvtizku12SZvstw9/EvVS7m8AKLR2lIub1HT461tMU+0YHy/u+ZSf2FwZovjBGFIrDjzaRK7FiVxyqk1vId2F6TZjispT6rHIwDIHOISLUmPyRSe4iB/ZI/GWJzUpd9wtex/gV/GzTTyFhQkVspZeE0jTXaHUmP8UE4FO6JVA9Gkeik460RgcBaFB3sP2nYxfdEQtI1iv3wGMOP06/V5YVSzPZiEnMBqkYYRfxP0iR/8s8cL0+ZeahIrlrUd40qUkNyYQn9qRsLsYTSFaMhtNBThae9a0ixlnXQ10MHjw+hiWwh6da82ZA0G83uvC5mCBJ9q+qH0mvuFh3f/gl8zD9X/kvLJsoD8POF692oQOwH+/HBxFjzAySa6aPFdBFgk5AxqxaMn0C3YPkZFyIIDMneXqX3oAVLvxE2UUba9RiasGgOz2rLajJ3I1yOzT0Vp9ls5R37UK1x/ozWI574QgYfNCMhK0gkFNTUJCJocLht97eSViuTRR+HyRNuh45fuojKaPqjJ83xqul3Tfg3GazabBifXk36TalCsMZRywf7lWD28mkweX1o72NlFr+8CdDzo5gChVHlmz8ohKdyIvNfagDAZF3zUOYttJqKENeWVhYa2wAUiSy6EplcwKsf4g5RhLJMQgJ2+9z6ncWH10QeI2auFYCBntKpujkpM+0r3JQQdcn/ukF3ajKuGXyu54L4Ao9z+3hzjSnEk0MZysekLeUSMlMzywUWuXG+Y/RHWYMAMaIBZbGD81yqaHXmVTHi2zoMiCicdCQRW+gbTV2LgLXKMAdF1QMxqkeVm/M1aTMR5Xsgi6LEYLLAxFi1ie+m1t/pNJMtF6ChksJq/SbgHkMJkkmJvaPkUpM7MgASYlL7DqtTMXA6GDz79cyi9TwOvvT37ipW//h4vxxl7FRGZe0k+fGHf7fnn3e4jilUQmPuvHTUtCV8jJJCgNYwZnsr4POMGIVW58MlbrXG+UxxW622jLYd88rBygKcfLJdvfQ6MEQnRvvecLCjpZP0Y2eRxQFcBzESv12Vqx5hxe4HXaIA+TklXz0jS20iuZwdBhTBtIid6drgNHBXwVZy/gJLFL6GMlxB5ydoFWC51GSTXXwWf0svJbFdRP0KZGort3NBlapt4seYq9qfC7HFq5O8KEpgLpZkavmYGYoyfg6JDFYlKisW/KbCkhAXUyj15VTIOmrQgzvloXPovrE527Vi8KR3Gz9ZsadgTkoBpt5ffIZN4WJJTfw/rMsxlaChZB//g5crH+f+MUMk12975UX3rtsP/Hb8hSkaFM9zhqJLDbhomw2EaTJfWV5IJwJ8EKzHblgF/O5ITIhT8r8Twq8DkilVTpFnx6sSl/TCtHYrbltSNLnAVe7Cm++N57ngtFvy8Oe/4pnrTREMV9VLdbR2WPGa5qkY+HrJMfXA3Nntg3rajBFpMOktirDX2F/w4ZFhvMBVRN1nSMXwRcUi9iqza2NSvGPd9fZFgPLCQNmZk9YMez8UaKkL/LE7nCx+xnQoG97+G23yMjK5JUixO05ZMx/c4Vf5WeY5ZNDDzsGds/0+N2OVdNrhMv9A9pjg+ePvjSRqTAcfvTWlNBGrNWbfNfLc6WIdAisCS/AVCGPt+dzY3T4raLuRrww4dH37QDPnrfKK/hykYT0Uw1fxxAguUzJwVDn7EYeVpzByAB+S6pCkPn4JtV7uRuqAy7vFSTqO4BbhHmORs5QtAi9eyEEqS1xgfCG/SftmoxwiSjWmTzDFDAzAIxeoLed7N4CSX5LFekACpnBX1SDAMAa8xtn3jcYuhyCyL9eY92K6FMD1rWYdPkFJ2ciQhIiEoxewl+VhOT6q8OowVufJnXpw+1wJZY8ICCLS5UloqjTLk97Ar4qW56lEAVZmq8Ngg3CTwNaMcKhDKtfCcRB8MybMho0Jx0uLLEi/7vyFKYu4BluynNpFeG6yfMw82TisfqcevqDai16v8obVcH+Zg5pROGMxHcsDEAYJu5fMGHInUrT6Elof+uVrO4r6r9we87xlVtrCH75ZUGWEWxwnpQ61AesAv/GC4kaeHuNnGdUq3vtWUYfON6E06MBSN1wABMatRbZROuhEkEAe+uHrSxd8Cb3JMBEIj0froJAPrkK1bzQ2GYxHF3oBIOdfMbFAj+AY/Yy9BgVvQ77a/Nqt32MUFiI3VKX6oOwVtGi2Sh57r7nNJ+2HTTzIDVkkFQyUBmik7Cd556BZBzNadT6bIAbYQ/z0+SZ+nMN+DnAE3J37UH1U//ePr9b6mBMB4V5QA9YVmP6/hVA963JO0X0/y449ujUcAioAAAAAA=";
 // רשימת המנהלים - מי שמופיע פה יוכל להפוך למנהל

// ===== רשימת השחקנים הקבועה =====
// רשימה מלאה של כל השחקנים שהופיעו בכל 4 השנים
const INITIAL_PLAYERS = [
  'רם', 'אילון', 'תומר', 'ניר', 'בראדלי', 'שמוליק', 'דניאל', 'יניב',
  'יואב', 'שראל', 'בן', 'לירון', 'רון', 'יובל מ.', 'רונן', 'אלירן',
  'גילי', 'שגיא', 'אלון', 'דני', 'שלומי', 'וולין', 'רועי', 'אסי',
  'אבי', 'איתמר', 'הילאי', 'שליו', 'כליפא', 'עידו רייטר', 'נדב', 'עידן',
  // שחקנים מהיסטוריה
  'איילון', 'נועם', 'נועם 2', 'אייל', 'ערן', "טל רג'וון", 'שחר', 'רז',
  'מיקי', 'יובל', 'אמנון', 'אשר/ערן', 'עודד'
];

// ===== היסטוריה מהאקסל (נתוני כל 4 השנים: 2023-2026) =====
const ALL_HISTORICAL_SESSIONS = [{"date":"2023-01-02","pot":70,"results":{"תומר":35,"שראל":15,"יניב":-10,"דניאל":40,"אסי":-100,"שלומי":-140,"רם":90},"host":"שלומי","season":2023},{"date":"2023-01-05","pot":0,"results":{"תומר":-20,"שראל":-60,"יניב":40,"רון":15,"דניאל":-95,"רם":85,"אלון":-80,"אמנון":-10,"כליפא":125},"host":"דניאל","season":2023},{"date":"2023-01-09","pot":150,"results":{"שגיא":35,"תומר":-15,"יניב":-80,"רון":-35,"אסי":-40,"שלומי":-60,"רם":175,"בראדלי":-70,"רונן":-60},"host":"שגיא","season":2023},{"date":"2023-01-12","pot":40,"results":{"שגיא":-20,"תומר":5,"שראל":10,"רון":-75,"דניאל":-60,"רם":95,"אלון":20,"לירון":-15},"host":"רון","season":2023},{"date":"2023-01-26","pot":10,"results":{"תומר":20,"שראל":50,"רון":80,"אלון":-80,"בראדלי":-35,"אייל":-75,"שמוליק":30},"host":"אלון","season":2023},{"date":"2023-01-30","pot":0,"results":{"שגיא":-10,"תומר":-35,"יניב":30,"רון":-45,"אסי":45,"שלומי":-120,"רם":110,"אלון":25},"host":"תומר","season":2023},{"date":"2023-02-06","pot":10,"results":{"שגיא":170,"תומר":-40,"יניב":-20,"רון":5,"דניאל":-60,"אסי":-45,"רם":10,"בראדלי":-10,"יובל מ.":-20},"host":"אסי","season":2023},{"date":"2023-02-09","pot":40,"results":{"שגיא":-10,"תומר":-50,"רון":110,"דניאל":-40,"אסי":20,"רם":30,"אלון":-45,"יובל":40,"יואב":-15},"host":"רם","season":2023},{"date":"2023-02-13","pot":20,"results":{"שגיא":-160,"תומר":65,"יניב":25,"רון":155,"אסי":-80,"שלומי":-100,"רם":120,"אלון":-5},"host":"שגיא","season":2023},{"date":"2026-02-16","pot":25,"results":{"תומר":-100,"שראל":-80,"רון":215,"אסי":-45,"רם":-70,"אלון":145,"בראדלי":-140,"אייל":50},"host":"רון","season":2023},{"date":"2026-02-23","pot":30,"results":{"שגיא":40,"תומר":-35,"שראל":-80,"רון":-100,"אסי":-15,"רם":95,"אלון":-60,"יובל מ.":125},"host":"רון","season":2023},{"date":"2023-02-27","pot":40,"results":{"תומר":-65,"יניב":35,"רון":-15,"דניאל":-40,"אסי":25,"שלומי":35,"רם":45,"בן":20},"host":"ניר","season":2023},{"date":"2023-03-06","pot":60,"results":{"שגיא":205,"תומר":-25,"אסי":-40,"שלומי":-25,"רם":-5,"בראדלי":-5,"רונן":-60,"שמוליק":15},"host":"שלומי","season":2023},{"date":"2023-03-13","pot":0,"results":{"שגיא":-80,"תומר":30,"שראל":20,"רון":55,"אסי":-60,"שלומי":10,"רם":-40,"בראדלי":-35,"נועם 2":100},"host":"שגיא","season":2023},{"date":"2023-03-16","pot":0,"results":{"תומר":80,"יניב":90,"רון":-10,"אלון":-20,"בראדלי":10,"ערן":55,"אייל":-95,"יובל":-110},"host":"ערן","season":2023},{"date":"2023-03-20","pot":20,"results":{"שגיא":-60,"תומר":30,"שראל":-40,"רון":-10,"אסי":25,"שלומי":-5,"רם":40},"host":"אסי","season":2023},{"date":"2023-03-23","pot":5,"results":{"שגיא":-70,"תומר":20,"שראל":-80,"יניב":-25,"רון":20,"דניאל":-20,"רם":85,"בראדלי":75},"host":"רון","season":2023},{"date":"2023-03-27","pot":40,"results":{"שגיא":-45,"תומר":-15,"יניב":50,"רון":30,"שלומי":25,"רם":-65,"בראדלי":-50,"רונן":30},"host":"רם","season":2023},{"date":"2023-04-03","pot":60,"results":{"שגיא":90,"תומר":-70,"יניב":30,"אסי":-40,"שלומי":-5,"רם":100,"בראדלי":15,"נועם":-60},"host":"תומר","season":2023},{"date":"2023-04-10","pot":80,"results":{"שגיא":120,"תומר":-20,"יניב":30,"רון":-55,"דניאל":-80,"רם":65,"בראדלי":20},"host":"שגיא","season":2023},{"date":"2023-04-13","pot":100,"results":{"שראל":95,"דניאל":10,"שלומי":-140,"רם":-20,"אלון":40,"רונן":110,"יובל":-195},"host":"דניאל","season":2023},{"date":"2023-04-18","pot":0,"results":{"שגיא":-120,"תומר":45,"שראל":25,"יניב":5,"רון":65,"דניאל":-40,"שלומי":20},"host":"שלומי","season":2023},{"date":"2023-04-20","pot":20,"results":{"שגיא":-80,"שראל":135,"רון":-20,"רם":15,"בראדלי":-40,"נועם":-40,"יובל מ.":10,"כליפא":40},"host":"תומר","season":2023},{"date":"2023-04-27","pot":0,"results":{"שגיא":190,"תומר":-40,"שראל":-40,"יניב":10,"רון":-80,"דניאל":45,"רם":-25,"אלון":-60},"host":"אסי","season":2023},{"date":"2023-05-01","pot":0,"results":{"שגיא":55,"תומר":-15,"שראל":20,"יניב":30,"רון":10,"שלומי":40,"רם":-70,"בראדלי":-70},"host":"יניב","season":2023},{"date":"2023-05-11","pot":0,"results":{"שגיא":-120,"תומר":-60,"שראל":20,"רון":20,"דניאל":-15,"אסי":20,"שלומי":-80,"רם":85,"אלון":130},"host":"רם","season":2023},{"date":"2023-05-15","pot":70,"results":{"שגיא":-20,"תומר":-100,"יניב":110,"רון":-5,"אסי":5,"שלומי":-10,"רם":-60,"בראדלי":10},"host":"בראדלי","season":2023},{"date":"2023-05-18","pot":10,"results":{"שגיא":-20,"תומר":-75,"שראל":20,"רון":95,"דניאל":-40,"אסי":5,"רם":-60,"אלון":45,"לירון":40},"host":"תומר","season":2023},{"date":"2023-05-22","pot":20,"results":{"שגיא":-160,"תומר":25,"יניב":90,"רון":-30,"אסי":140,"שלומי":-10,"רם":10,"יובל מ.":-60,"נועם 2":-25},"host":"שגיא","season":2023},{"date":"2023-05-29","pot":80,"results":{"תומר":15,"שראל":-30,"יניב":15,"רון":40,"אסי":-80,"שלומי":90,"רם":100,"אלון":-70},"host":"תומר","season":2023},{"date":"2023-06-01","pot":30,"results":{"שגיא":-5,"תומר":60,"שראל":-100,"יניב":50,"רון":-40,"דניאל":50,"רם":-20,"בראדלי":-25},"host":"תומר","season":2023},{"date":"2023-06-05","pot":40,"results":{"שגיא":50,"תומר":10,"יניב":20,"רון":5,"אסי":-20,"שלומי":-35,"רם":-95,"רונן":105,"שמוליק":40,"בן":-40},"host":"ניר","season":2023},{"date":"2023-06-08","pot":0,"results":{"שגיא":-15,"תומר":-15,"רון":70,"בראדלי":35,"אייל":-95,"רועי":-40,"יובל מ.":80,"אמנון":-60,"לירון":40},"host":"רון","season":2023},{"date":"2023-06-12","pot":0,"results":{"תומר":-10,"שראל":15,"יניב":-25,"דניאל":-10,"אסי":65,"שלומי":-90,"רם":-5,"בראדלי":-20,"שמוליק":80},"host":"אסי","season":2023},{"date":"2023-06-15","pot":0,"results":{"תומר":25,"שראל":-55,"רון":-40,"דניאל":-40,"אסי":-80,"רם":80,"אלון":120,"לירון":-10},"host":"לירון","season":2023},{"date":"2023-06-19","pot":40,"results":{"שגיא":-35,"תומר":55,"יניב":30,"רון":-30,"רם":10,"בראדלי":10},"host":"רם","season":2023},{"date":"2023-06-22","pot":0,"results":{"שגיא":125,"תומר":-15,"שראל":-30,"רון":-15,"דניאל":-40,"שלומי":15,"רם":40,"אלון":-40,"לירון":-40},"host":"רון","season":2023},{"date":"2023-06-26","pot":60,"results":{"שגיא":-40,"יניב":-10,"רון":-20,"שלומי":70,"רם":65,"אלון":25,"בראדלי":-30},"host":"שלומי","season":2023},{"date":"2023-06-30","pot":60,"results":{"תומר":25,"שראל":-160,"דניאל":75,"בראדלי":-10,"אייל":-60,"נועם":10,"טל רג'וון":60},"host":"תומר","season":2023},{"date":"2023-07-03","pot":20,"results":{"תומר":75,"שראל":-40,"רון":-35,"דניאל":35,"שלומי":-15,"רם":-60,"בראדלי":40,"יובל מ.":20},"host":"דניאל","season":2023},{"date":"2023-07-06","pot":30,"results":{"תומר":-35,"שראל":-60,"רון":-10,"דניאל":35,"אסי":-20,"רם":-10,"לירון":70},"host":"לירון","season":2023},{"date":"2023-07-10","pot":20,"results":{"תומר":-30,"שראל":-25,"רון":-25,"אסי":-40,"שלומי":15,"רם":40,"בראדלי":55,"שמוליק":65,"יואב":-35},"host":"רם","season":2023},{"date":"2023-07-13","pot":40,"results":{"שגיא":120,"תומר":10,"רון":45,"אלון":-35,"בראדלי":-30,"טל רג'וון":10,"לירון":-80},"host":"לירון","season":2023},{"date":"2023-07-16","pot":20,"results":{"שגיא":-135,"תומר":20,"רון":75,"שלומי":15,"רם":60,"טל רג'וון":-15},"host":"שגיא","season":2023},{"date":"2023-07-20","pot":0,"results":{"תומר":15,"שראל":130,"יניב":-40,"רון":-115,"אסי":-25,"רם":85,"אלון":-100,"בראדלי":-10,"יובל מ.":60},"host":"תומר","season":2023},{"date":"2023-07-24","pot":0,"results":{"שגיא":-80,"תומר":5,"שראל":50,"יניב":10,"רון":50,"אסי":40,"שלומי":15,"רם":-100,"אלון":10},"host":"שלומי","season":2023},{"date":"2023-07-29","pot":40,"results":{"שגיא":50,"תומר":-10,"רון":15,"אסי":40,"שלומי":50,"רם":-60,"אלון":-45},"host":"שלומי","season":2023},{"date":"2023-07-31","pot":0,"results":{"שגיא":140,"תומר":-30,"יניב":70,"רון":-90,"אסי":-60,"שלומי":-35,"רם":-80,"בראדלי":85},"host":"בראדלי","season":2023},{"date":"2023-08-08","pot":15,"results":{"שגיא":35,"תומר":-45,"שראל":105,"אסי":20,"שלומי":-60,"בראדלי":-60,"רונן":-10},"host":"אסי","season":2023},{"date":"2023-08-14","pot":40,"results":{"שגיא":-75,"תומר":20,"שראל":-25,"יניב":45,"רון":-60,"אסי":-60,"אלון":-20,"בראדלי":-25,"שמוליק":160},"host":"שגיא","season":2023},{"date":"2023-08-17","pot":60,"results":{"שגיא":-100,"תומר":-140,"שראל":105,"יניב":-25,"רון":-80,"דניאל":140,"רם":120,"אלון":-80},"host":"דניאל","season":2023},{"date":"2023-08-21","pot":20,"results":{"שגיא":120,"רון":20,"דניאל":115,"שלומי":-160,"רם":5,"בראדלי":-55,"רונן":-60,"יואב":-5},"host":"רם","season":2023},{"date":"2023-08-24","pot":20,"results":{"תומר":-60,"שראל":-15,"רון":10,"דניאל":-20,"אסי":15,"רם":140,"אלון":-90},"host":"רון","season":2023},{"date":"2023-08-28","pot":0,"results":{"שגיא":-180,"תומר":60,"שראל":-20,"רון":65,"רם":65,"בראדלי":10},"host":"תומר","season":2023},{"date":"2023-08-31","pot":60,"results":{"שגיא":-120,"תומר":50,"רון":-45,"דניאל":-15,"אסי":165,"שלומי":-60,"רם":25,"אלון":50,"יובל מ.":10},"host":"דניאל","season":2023},{"date":"2023-09-04","pot":0,"results":{"שגיא":45,"תומר":10,"יניב":25,"רון":-15,"דניאל":-20,"שלומי":-30,"רם":-25,"אלון":-20,"בראדלי":30},"host":"שלומי","season":2023},{"date":"2023-09-07","pot":20,"results":{"תומר":15,"שראל":-80,"רון":-10,"דניאל":-10,"אסי":-20,"שלומי":75,"רם":45,"בראדלי":5},"host":"רון","season":2023},{"date":"2023-09-11","pot":20,"results":{"שגיא":-60,"רון":-5,"אסי":-60,"שלומי":-15,"רם":-10,"שמוליק":115,"יובל מ.":55},"host":"שגיא","season":2023},{"date":"2023-09-19","pot":20,"results":{"תומר":65,"שראל":10,"יניב":-15,"רון":-60,"דניאל":40,"רם":-20},"host":"אסי","season":2023},{"date":"2023-09-21","pot":70,"results":{"שראל":75,"אסי":-5,"שלומי":-5,"רם":-60,"אלון":45,"בראדלי":-80,"יובל מ.":-40},"host":"בראדלי","season":2023},{"date":"2023-09-28","pot":0,"results":{"שגיא":-80,"רון":-25,"דניאל":25,"אסי":-5,"שלומי":-20,"אלון":-200,"בראדלי":75,"נועם 2":230},"host":"שגיא","season":2023},{"date":"2023-10-02","pot":0,"results":{"שגיא":-145,"תומר":-70,"רון":45,"דניאל":80,"אסי":225,"רם":-35,"רועי":-80,"יואב":-20},"host":"רם","season":2023},{"date":"2023-10-05","pot":0,"results":{"תומר":15,"שראל":-5,"רון":-5,"דניאל":-40,"אסי":40,"שלומי":-55,"רם":110,"אלון":-60},"host":"דניאל","season":2023},{"date":"2023-10-19","pot":0,"results":{"שגיא":5,"תומר":55,"שראל":-30,"רון":90,"דניאל":35,"אסי":-80,"רם":-15,"בראדלי":-60},"host":"רון","season":2023},{"date":"2023-10-23","pot":0,"results":{"שגיא":35,"תומר":-35,"יניב":-40,"אסי":-20,"שלומי":30,"רם":50,"שמוליק":-20},"host":"רון","season":2023},{"date":"2023-10-26","pot":0,"results":{"שגיא":-95,"תומר":110,"שראל":-80,"רון":40,"דניאל":10,"שלומי":100,"רם":-100,"בראדלי":15},"host":"תומר","season":2023},{"date":"2023-10-30","pot":0,"results":{"שגיא":70,"יניב":-20,"רון":65,"דניאל":25,"רונן":-10,"שמוליק":-130},"host":"רון","season":2023},{"date":"2023-11-02","pot":40,"results":{"שגיא":15,"תומר":85,"שראל":-60,"רון":-10,"דניאל":-15,"שלומי":-100,"רם":10,"בראדלי":10,"יואב":25},"host":"רם","season":2023},{"date":"2023-11-06","pot":0,"results":{"שגיא":-180,"תומר":55,"יניב":25,"רון":-45,"אסי":70,"שלומי":-40,"רם":100,"בראדלי":15},"host":"אסי","season":2023},{"date":"2023-11-13","pot":0,"results":{"שגיא":-35,"תומר":10,"שראל":-20,"יניב":20,"רון":-20,"אסי":-20,"שמוליק":65},"host":"רון","season":2023},{"date":"2023-11-16","pot":60,"results":{"שגיא":-20,"תומר":35,"יניב":45,"רון":-55,"שלומי":65,"רם":-140,"בראדלי":5,"יובל מ.":125},"host":"תומר","season":2023},{"date":"2023-11-20","pot":10,"results":{"שגיא":-45,"תומר":-45,"יניב":20,"רון":-20,"דניאל":-20,"שלומי":55,"רם":-30,"רועי":75},"host":"שגיא","season":2023},{"date":"2023-11-23","pot":50,"results":{"שגיא":45,"תומר":40,"שראל":-160,"יניב":-40,"רון":15,"דניאל":-30,"אסי":35,"רם":30,"בראדלי":5},"host":"דניאל","season":2023},{"date":"2023-11-27","pot":90,"results":{"שגיא":-80,"תומר":20,"יניב":25,"רון":65,"דניאל":30,"רונן":-10,"רועי":-120,"רז":-20},"host":"תומר","season":2023},{"date":"2023-11-30","pot":80,"results":{"תומר":10,"שראל":-40,"רון":40,"דניאל":-35,"שלומי":-120,"רם":165,"בראדלי":-35,"יובל מ.":-40,"יואב":-25},"host":"רם","season":2023},{"date":"2023-12-04","pot":85,"results":{"שגיא":-90,"תומר":15,"יניב":110,"רון":10,"אסי":-80,"שלומי":-25,"שמוליק":35,"בן":-60},"host":"ניר","season":2023},{"date":"2023-12-07","pot":40,"results":{"שגיא":40,"תומר":-80,"רון":-80,"רם":-100,"אלון":-50,"בראדלי":50,"יובל":280,"רועי":-100},"host":"בראדלי","season":2023},{"date":"2023-12-11","pot":40,"results":{"שגיא":-60,"תומר":40,"יניב":55,"רון":70,"אסי":100,"שלומי":-100,"רם":-100,"בראדלי":-45},"host":"אסי","season":2023},{"date":"2023-12-14","pot":100,"results":{"תומר":-100,"שראל":155,"רון":35,"דניאל":50,"רם":-65,"אלון":-60,"כליפא":-115},"host":"רון","season":2023},{"date":"2023-12-19","pot":20,"results":{"שגיא":-80,"תומר":-15,"יניב":-5,"רון":25,"דניאל":20,"שלומי":35,"רם":30,"רועי":-30},"host":"שלומי","season":2023},{"date":"2023-12-21","pot":40,"results":{"תומר":-120,"שראל":15,"יניב":20,"רון":45,"דניאל":-60,"בראדלי":-5,"אייל":-40,"לירון":105},"host":"שראל","season":2023},{"date":"2023-12-25","pot":30,"results":{"שגיא":-35,"יניב":10,"רון":-60,"דניאל":20,"אסי":-35,"שלומי":-15,"רם":80,"יובל מ.":5},"host":"אסי","season":2023},{"date":"2023-12-28","pot":25,"results":{"שגיא":80,"תומר":-25,"שראל":40,"רון":35,"דניאל":15,"אסי":-20,"רם":-100,"בראדלי":-50},"host":"דניאל","season":2023},{"date":"2023-12-30","pot":85,"results":{"תומר":105,"שראל":-70,"יניב":85,"רון":-50,"דניאל":-20,"אסי":-40,"רם":-55,"רועי":-40},"host":"אסי","season":2023},{"date":"2024-01-01","pot":200,"results":{"ניר":-100,"שגיא":45,"תומר":80,"יניב":-20,"רון":50,"בראדלי":25,"רועי":-60,"נועם 2":-20},"host":"שגיא","season":2024},{"date":"2023-01-04","pot":205,"results":{"ניר":-60,"שגיא":85,"תומר":-5,"שראל":-40,"רון":-20,"דניאל":50,"אסי":-80,"שלומי":35,"רם":35},"host":"אסי","season":2024},{"date":"2024-01-11","pot":160,"results":{"שגיא":60,"תומר":20,"רון":50,"דניאל":-10,"אסי":-20,"שלומי":20,"רם":-90,"אלון":10,"בראדלי":-40},"host":"שלומי","season":2024},{"date":"2024-01-15","pot":195,"results":{"שגיא":120,"תומר":20,"שראל":-30,"יניב":-20,"רון":-60,"דניאל":-40,"שלומי":-35,"רם":55,"רועי":-10},"host":"רון","season":2024},{"date":"2024-01-29","pot":175,"results":{"ניר":15,"שגיא":100,"תומר":-15,"יניב":-30,"רון":-45,"דניאל":60,"אסי":-25,"רם":-40,"אלון":-20},"host":"אסי","season":2024},{"date":"2024-02-01","pot":245,"results":{"ניר":85,"שגיא":-40,"תומר":-60,"שראל":-80,"רון":-35,"דניאל":35,"אסי":45,"שלומי":80,"רועי":-30},"host":"רון","season":2024},{"date":"2024-02-05","pot":220,"results":{"ניר":20,"שגיא":105,"תומר":15,"יניב":-25,"רון":-55,"דניאל":80,"שלומי":-60,"רם":-60,"בראדלי":-20},"host":"שגיא","season":2024},{"date":"2024-02-08","pot":315,"results":{"ניר":-40,"תומר":30,"שראל":-100,"רון":-10,"דניאל":-20,"אסי":-100,"אלון":-45,"רועי":270,"יובל מ.":15},"host":"תומר","season":2024},{"date":"2023-02-12","pot":320,"results":{"ניר":90,"שגיא":-115,"תומר":20,"יניב":50,"רון":25,"רם":105,"בראדלי":-25,"שמוליק":-120,"רועי":-60,"יואב":30},"host":"רם","season":2024},{"date":"2024-02-15","pot":320,"results":{"ניר":70,"שגיא":-90,"תומר":-55,"שראל":165,"רון":50,"אסי":-120,"שלומי":35,"לירון":-55},"host":"אסי","season":2024},{"date":"2024-02-20","pot":215,"results":{"שגיא":110,"תומר":15,"שראל":50,"רון":-20,"דניאל":40,"שלומי":-115,"רם":-20,"רועי":-60},"host":"שלומי","season":2024},{"date":"2024-02-22","pot":145,"results":{"שגיא":5,"תומר":-40,"שראל":-20,"יניב":-45,"רון":95,"דניאל":30,"רם":15,"בן":-40},"host":"ניר","season":2024},{"date":"2024-02-26","pot":290,"results":{"שגיא":25,"תומר":40,"יניב":-20,"רון":-60,"דניאל":-10,"שלומי":-200,"רם":100,"בראדלי":100,"רועי":25},"host":"רועי","season":2024},{"date":"2024-02-29","pot":165,"results":{"ניר":30,"תומר":5,"שראל":-40,"רון":25,"דניאל":85,"רם":-40,"אלון":-45,"בראדלי":-40,"יובל מ.":20},"host":"דניאל","season":2024},{"date":"2024-03-04","pot":130,"results":{"ניר":20,"שגיא":-60,"תומר":30,"יניב":10,"רון":25,"דניאל":45,"רונן":-15,"רועי":-15,"בן":-40},"host":"ניר","season":2024},{"date":"2024-03-07","pot":190,"results":{"תומר":-40,"שראל":105,"רון":-120,"דניאל":20,"רם":15,"אלון":50,"בראדלי":-15,"לירון":-15},"host":"רון","season":2024},{"date":"2024-03-11","pot":140,"results":{"ניר":-60,"שגיא":65,"יניב":-5,"רון":5,"דניאל":-45,"שלומי":-30,"רם":70},"host":"שגיא","season":2024},{"date":"2024-03-14","pot":185,"results":{"ניר":-20,"שגיא":30,"תומר":55,"שראל":25,"רון":-80,"אסי":-60,"שלומי":75,"בראדלי":-25},"host":"תומר","season":2024},{"date":"2024-03-21","pot":345,"results":{"ניר":-80,"שגיא":-20,"שראל":100,"דניאל":-25,"אסי":-80,"שלומי":40,"רם":-100,"אלון":80,"בראדלי":125,"רועי":-40},"host":"דניאל","season":2024},{"date":"2024-03-25","pot":130,"results":{"ניר":115,"רון":-5,"דניאל":-20,"אסי":5,"שלומי":10,"בראדלי":-25,"רועי":-80},"host":"בראדלי","season":2024},{"date":"2024-03-28","pot":250,"results":{"ניר":70,"שגיא":-40,"תומר":30,"שראל":-40,"רון":-20,"אסי":150,"שלומי":-90,"בראדלי":-60},"host":"אסי","season":2024},{"date":"2024-04-01","pot":360,"results":{"ניר":10,"תומר":-100,"יניב":55,"רון":-70,"שלומי":-45,"רונן":35,"שמוליק":260,"יובל":-85,"רועי":-60},"host":"תומר","season":2024},{"date":"2024-04-04","pot":280,"results":{"ניר":-80,"תומר":-40,"שראל":75,"רון":-30,"שלומי":5,"רם":170,"בראדלי":-50,"יובל מ.":-80,"יואב":30},"host":"רם","season":2024},{"date":"2024-04-08","pot":215,"results":{"שגיא":-50,"תומר":10,"רון":100,"דניאל":50,"אסי":25,"רם":30,"נועם 2":-105,"לירון":-60},"host":"שגיא","season":2024},{"date":"2024-04-11","pot":240,"results":{"תומר":-20,"שראל":20,"יניב":-45,"רון":-55,"דניאל":70,"רם":70,"בראדלי":80,"אייל":-120},"host":"בראדלי","season":2024},{"date":"2024-04-15","pot":300,"results":{"שגיא":-120,"תומר":120,"יניב":-10,"רון":110,"דניאל":70,"אסי":-40,"שלומי":-80,"רועי":-10,"אמנון":-40},"host":"שלומי","season":2024},{"date":"2024-04-18","pot":395,"results":{"שגיא":210,"תומר":-60,"שראל":-120,"רון":30,"דניאל":45,"שלומי":-60,"רם":-100,"אלון":110,"בראדלי":-15,"יובל":-40},"host":"דניאל","season":2024},{"date":"2024-05-02","pot":420,"results":{"שגיא":-140,"שראל":-120,"רון":-20,"דניאל":115,"אסי":-55,"רם":150,"בראדלי":155,"רועי":-85},"host":"אסי","season":2024},{"date":"2024-05-06","pot":340,"results":{"שגיא":-100,"תומר":-70,"יניב":5,"רון":80,"דניאל":-10,"שלומי":-80,"רם":190,"רונן":-80,"רועי":65},"host":"רם","season":2024},{"date":"2024-05-09","pot":280,"results":{"תומר":20,"שראל":-60,"רון":65,"דניאל":140,"אסי":-40,"שלומי":10,"רם":45,"אלון":-120,"בראדלי":-60},"host":"תומר","season":2024},{"date":"2024-05-16","pot":255,"results":{"שגיא":-60,"תומר":-5,"רון":-25,"דניאל":-80,"אסי":20,"שלומי":120,"רם":-60,"בראדלי":-25,"רועי":115},"host":"רועי","season":2024},{"date":"2024-05-20","pot":440,"results":{"שגיא":180,"תומר":15,"יניב":45,"רון":105,"דניאל":25,"שלומי":-200,"רם":-100,"אלון":-140,"רועי":70},"host":"שגיא","season":2024},{"date":"2024-05-27","pot":130,"results":{"ניר":20,"שגיא":-100,"תומר":-5,"רון":40,"אסי":35,"שלומי":35,"רם":-20,"רועי":-5},"host":"שלומי","season":2024},{"date":"2024-05-30","pot":145,"results":{"ניר":110,"שגיא":-5,"תומר":10,"שראל":-60,"יניב":10,"רון":10,"שלומי":-50,"בראדלי":5,"יובל מ.":-30},"host":"רון","season":2024},{"date":"2024-06-03","pot":270,"results":{"ניר":-40,"שגיא":25,"תומר":-60,"יניב":-40,"רון":-10,"דניאל":180,"אסי":-60,"רם":65,"רועי":-60},"host":"רועי","season":2024},{"date":"2024-06-06","pot":180,"results":{"שגיא":-15,"תומר":-15,"רון":5,"שלומי":85,"רם":60,"אלון":-120,"בראדלי":-30,"יובל מ.":30},"host":"יובל מ.","season":2024},{"date":"2024-06-10","pot":215,"results":{"ניר":90,"שגיא":-90,"תומר":55,"יניב":-20,"רון":5,"אסי":-25,"שלומי":30,"רם":-80,"בן":35},"host":"ניר","season":2024},{"date":"2024-06-17","pot":160,"results":{"ניר":10,"שגיא":-100,"תומר":-20,"רון":-40,"דניאל":45,"שלומי":10,"רם":90,"שמוליק":5},"host":"שגיא","season":2024},{"date":"2024-06-25","pot":225,"results":{"ניר":30,"שגיא":-140,"תומר":60,"רון":-40,"אסי":-40,"רם":90,"בראדלי":10,"רועי":-5,"כליפא":35},"host":"תומר","season":2024},{"date":"2024-07-01","pot":405,"results":{"ניר":-10,"שגיא":-140,"תומר":-75,"רון":170,"דניאל":-40,"שלומי":55,"רם":145,"אלון":-70,"רועי":35,"יואב":-10,"אשר/ערן":-60},"host":"רם","season":2024},{"date":"2024-07-04","pot":65,"results":{"ניר":-10,"שגיא":30,"תומר":-10,"רון":5,"דניאל":15,"שלומי":-20,"רם":15,"בראדלי":-5,"יובל מ.":-20},"host":"דניאל","season":2024},{"date":"2024-07-08","pot":170,"results":{"ניר":-20,"תומר":25,"רון":-30,"דניאל":25,"שלומי":-60,"רם":70,"בראדלי":40,"שמוליק":10,"רועי":-60},"host":"בראדלי","season":2024},{"date":"2024-07-11","pot":195,"results":{"ניר":80,"רון":-70,"דניאל":55,"רם":40,"אלון":20,"אייל":-80,"גילי":-45},"host":"רון","season":2024},{"date":"2024-07-15","pot":165,"results":{"ניר":-20,"שגיא":-60,"יניב":35,"רון":10,"דניאל":-5,"רם":100,"בראדלי":-80,"רועי":20},"host":"שגיא","season":2024},{"date":"2024-07-22","pot":430,"results":{"ניר":-40,"שגיא":25,"תומר":50,"רון":170,"אסי":-120,"שלומי":-200,"רם":95,"בראדלי":-70,"לירון":90},"host":"בראדלי","season":2024},{"date":"2024-07-29","pot":300,"results":{"ניר":-50,"שגיא":55,"תומר":-40,"רון":170,"רם":-40,"רונן":75,"שמוליק":-100,"רועי":-70},"host":"ניר","season":2024},{"date":"2024-08-01","pot":50,"results":{"תומר":-35,"יניב":-15,"בראדלי":50},"host":"בראדלי","season":2024},{"date":"2024-08-05","pot":290,"results":{"שגיא":105,"תומר":25,"יניב":-60,"רון":10,"שלומי":-30,"רם":150,"בראדלי":-100,"רועי":-100},"host":"רועי","season":2024},{"date":"2024-08-08","pot":255,"results":{"שגיא":-30,"תומר":65,"רון":-80,"שלומי":65,"רם":-60,"בראדלי":-60,"איילון":-25,"גילי":125},"host":"שלומי","season":2024},{"date":"2024-08-12","pot":255,"results":{"ניר":40,"שגיא":50,"תומר":-100,"יניב":-15,"רון":-20,"רם":-40,"רונן":165,"שמוליק":-15,"רועי":-65},"host":"יניב","season":2024},{"date":"2024-08-15","pot":375,"results":{"שגיא":145,"תומר":-50,"שראל":-5,"רון":110,"דניאל":100,"שלומי":-120,"בראדלי":20,"כליפא":-160,"גילי":-20,"נדב":-20},"host":"דניאל","season":2024},{"date":"2024-08-19","pot":290,"results":{"ניר":-50,"שגיא":60,"תומר":20,"יניב":95,"רון":45,"דניאל":-20,"שלומי":-120,"רם":70,"רונן":-100},"host":"תומר","season":2024},{"date":"2024-08-22","pot":240,"results":{"שגיא":-85,"תומר":-20,"רון":10,"דניאל":130,"אסי":-35,"שלומי":10,"רם":-60,"בראדלי":-40,"רועי":90},"host":"בראדלי","season":2024},{"date":"2024-08-26","pot":175,"results":{"ניר":10,"שגיא":-25,"תומר":-100,"יניב":40,"רון":-10,"דניאל":80,"שלומי":35,"רם":-20,"רועי":-20,"בן":10},"host":"ניר","season":2024},{"date":"2024-08-29","pot":250,"results":{"שגיא":-100,"תומר":-10,"יניב":-20,"רון":40,"דניאל":-20,"אסי":-60,"רם":90,"אלון":-40,"בראדלי":90,"אייל":15,"יובל":15},"host":"שגיא","season":2024},{"date":"2024-09-02","pot":245,"results":{"שגיא":-5,"תומר":-35,"שראל":-80,"יניב":60,"רון":-70,"אסי":80,"שלומי":50,"רם":-55,"רועי":55},"host":"שלומי","season":2024},{"date":"2024-09-05","pot":280,"results":{"שגיא":-80,"תומר":75,"רון":-10,"דניאל":95,"שלומי":70,"רם":40,"בראדלי":-50,"איילון":-80,"גילי":-60},"host":"תומר","season":2024},{"date":"2024-09-09","pot":110,"results":{"שגיא":-20,"תומר":20,"יניב":10,"רון":20,"אסי":-15,"רם":10,"בראדלי":-35,"רועי":-40,"יובל מ.":50},"host":"רם","season":2024},{"date":"2024-09-16","pot":235,"results":{"ניר":60,"שגיא":60,"תומר":35,"יניב":40,"רון":35,"שלומי":-75,"אלון":-80,"בראדלי":-80,"רועי":5},"host":"רועי","season":2024},{"date":"2024-09-19","pot":270,"results":{"תומר":-10,"שראל":35,"רון":-85,"שלומי":-105,"רם":165,"בראדלי":70,"איילון":-60,"גילי":-10},"host":"רון","season":2024},{"date":"2024-09-23","pot":200,"results":{"שגיא":-20,"יניב":55,"רון":60,"דניאל":-40,"רם":-40,"רונן":-100,"שמוליק":20,"רועי":65},"host":"שגיא","season":2024},{"date":"2024-09-30","pot":245,"results":{"שגיא":-80,"תומר":-40,"יניב":10,"דניאל":100,"אסי":-85,"שלומי":100,"רם":35,"רועי":-40},"host":"אסי","season":2024},{"date":"2024-10-08","pot":240,"results":{"שגיא":85,"תומר":35,"דניאל":10,"אסי":65,"שלומי":-80,"רם":-60,"בראדלי":5,"רועי":-100,"יואב":40},"host":"רם","season":2024},{"date":"2024-10-10","pot":145,"results":{"ניר":50,"שגיא":-30,"תומר":-60,"שראל":90,"דניאל":-20,"יובל מ.":5,"גילי":-10,"לירון":-5,"נדב":-20},"host":"דניאל","season":2024},{"date":"2024-10-14","pot":315,"results":{"שגיא":-140,"תומר":80,"יניב":140,"רון":10,"דניאל":-50,"שלומי":-60,"בראדלי":-20,"רונן":85,"רועי":-45},"host":"תומר","season":2024},{"date":"2024-10-17","pot":305,"results":{"שגיא":-100,"תומר":50,"שראל":45,"יניב":45,"רון":-140,"שלומי":-60,"איילון":165,"גילי":-5},"host":"שגיא","season":2024},{"date":"2024-10-21","pot":175,"results":{"ניר":50,"תומר":20,"שראל":55,"רון":-30,"אסי":-100,"שלומי":45,"רם":5,"בראדלי":-45},"host":"אסי","season":2024},{"date":"2024-10-24","pot":270,"results":{"ניר":80,"שראל":85,"יניב":5,"רון":-100,"דניאל":100,"איילון":-45,"רועי":-40,"גילי":-85},"host":"גילי","season":2024},{"date":"2024-10-28","pot":235,"results":{"ניר":-100,"תומר":120,"יניב":-60,"רם":-55,"איילון":10,"רונן":-20,"שמוליק":105},"host":"רועי","season":2024},{"date":"2024-10-31","pot":195,"results":{"תומר":-25,"שראל":-40,"דניאל":70,"אסי":-60,"שלומי":60,"רם":-60,"בראדלי":5,"יובל מ.":60,"גילי":-10},"host":"שלומי","season":2024},{"date":"2024-11-04","pot":350,"results":{"שגיא":-75,"יניב":-40,"רון":70,"דניאל":-60,"אסי":-25,"שלומי":-150,"רם":130,"אלון":10,"רועי":140},"host":"אסי","season":2024},{"date":"2024-11-07","pot":200,"results":{"ניר":10,"תומר":-40,"רון":40,"שלומי":70,"בראדלי":70,"איילון":-80,"מיקי":-20,"גילי":10,"לירון":-60},"host":"תומר","season":2024},{"date":"2024-11-11","pot":240,"results":{"שגיא":170,"תומר":25,"רון":15,"דניאל":-40,"אסי":-20,"שלומי":30,"רם":-80,"בראדלי":-30,"יואב":-10,"גילי":-60},"host":"רם","season":2024},{"date":"2024-11-14","pot":260,"results":{"ניר":-40,"תומר":50,"שראל":-60,"רון":10,"דניאל":-80,"רם":60,"אלון":-80,"איילון":25,"גילי":115},"host":"רון","season":2024},{"date":"2024-11-18","pot":330,"results":{"שגיא":-180,"תומר":35,"יניב":-50,"רון":70,"רם":60,"שמוליק":165,"רועי":-100},"host":"שגיא","season":2024},{"date":"2024-11-21","pot":280,"results":{"שגיא":115,"תומר":-40,"שראל":-30,"רון":-65,"דניאל":-25,"רם":20,"איילון":145,"יובל מ.":-120},"host":"יובל מ.","season":2024},{"date":"2024-11-25","pot":130,"results":{"ניר":40,"שגיא":20,"רון":10,"אסי":-40,"שלומי":-20,"רם":-60,"רועי":-10,"גילי":60},"host":"רון","season":2024},{"date":"2024-11-28","pot":300,"results":{"ניר":60,"שגיא":-60,"שראל":155,"רון":-90,"אסי":10,"שלומי":-115,"בראדלי":-35,"איילון":65,"גילי":10},"host":"שלומי","season":2024},{"date":"2024-12-02","pot":240,"results":{"שגיא":-120,"תומר":-60,"יניב":80,"רון":115,"דניאל":25,"אסי":20,"רם":-40,"גילי":-20},"host":"אסי","season":2024},{"date":"2024-12-05","pot":310,"results":{"ניר":-80,"שגיא":-100,"תומר":55,"שראל":-15,"רון":-100,"בראדלי":155,"איילון":-15,"גילי":100},"host":"גילי","season":2024},{"date":"2024-12-09","pot":245,"results":{"ניר":100,"שגיא":-20,"תומר":40,"יניב":70,"רון":-85,"רם":-45,"אלון":-15,"רועי":-80,"גילי":35},"host":"שגיא","season":2024},{"date":"2024-12-12","pot":430,"results":{"ניר":-40,"שגיא":-30,"תומר":-60,"שראל":15,"רון":55,"שלומי":-160,"רם":-140,"אלון":80,"בראדלי":5,"רועי":275},"host":"בראדלי","season":2024},{"date":"2024-12-16","pot":220,"results":{"ניר":120,"שגיא":5,"תומר":5,"יניב":90,"רון":-75,"רונן":-80,"רועי":-10,"לירון":-55},"host":"תומר","season":2024},{"date":"2024-12-19","pot":120,"results":{"תומר":-20,"שראל":60,"רון":25,"שלומי":-40,"בראדלי":10,"איילון":25,"גילי":-60},"host":"דניאל","season":2024},{"date":"2024-12-23","pot":210,"results":{"ניר":40,"שגיא":-50,"תומר":55,"שראל":60,"רון":-60,"דניאל":-60,"אסי":-5,"אלון":-35,"יובל מ.":55},"host":"שגיא","season":2024},{"date":"2024-12-25","pot":260,"results":{"ניר":30,"שגיא":-100,"תומר":85,"רון":55,"דניאל":-20,"רם":-55,"בראדלי":-5,"איילון":-20,"שמוליק":90,"גילי":-60},"host":"רם","season":2024},{"date":"2024-12-26","pot":300,"results":{"ניר":-10,"תומר":-25,"שראל":100,"יניב":15,"רון":15,"אלון":-80,"בראדלי":75,"רונן":-25,"אייל":45,"שמוליק":-100,"יובל":50,"אשר/ערן":-60},"host":"יובל","season":2024},{"date":"2024-12-30","pot":185,"results":{"ניר":-40,"שגיא":5,"תומר":10,"יניב":80,"רון":45,"דניאל":15,"שלומי":-45,"רם":30,"רועי":-60,"יואב":-20,"גילי":-20},"host":"רם","season":2024},{"date":"2025-01-02","pot":270,"results":{"ניר":-20,"תומר":25,"שראל":-20,"רון":-80,"אסי":45,"שלומי":75,"רם":-25,"בראדלי":-45,"אילון":-80,"גילי":125},"host":"שלומי","season":2025},{"date":"2025-01-06","pot":255,"results":{"ניר":80,"שגיא":-140,"תומר":5,"יניב":10,"רון":105,"דניאל":20,"רם":-60,"רועי":-55,"גילי":35},"host":"רועי","season":2025},{"date":"2025-01-09","pot":195,"results":{"שגיא":110,"תומר":10,"רון":-40,"דניאל":-20,"שלומי":-60,"אלון":-75,"גילי":75},"host":"רון","season":2025},{"date":"2024-01-13","pot":240,"results":{"ניר":-20,"שגיא":25,"תומר":45,"רון":25,"אסי":-40,"שלומי":-60,"בראדלי":-60,"רונן":-60,"רועי":135,"גילי":10},"host":"תומר","season":2025},{"date":"2025-01-20","pot":75,"results":{"שגיא":-50,"תומר":65,"בראדלי":10,"רועי":-20,"גילי":-5},"host":"שגיא","season":2025},{"date":"2025-01-23","pot":365,"results":{"שגיא":-140,"תומר":-120,"שראל":25,"רון":-45,"רם":-60,"אילון":115,"יובל מ.":225},"host":"גילי","season":2025},{"date":"2024-01-27","pot":250,"results":{"שגיא":55,"שראל":165,"יניב":-60,"רון":-40,"דניאל":15,"שלומי":-20,"רם":15,"רועי":-100,"יואב":-20,"גילי":-10},"host":"רם","season":2025},{"date":"2025-02-10","pot":160,"results":{"ניר":-20,"שגיא":65,"רון":5,"אסי":50,"אלון":-25,"בראדלי":-55,"שמוליק":40,"גילי":-60},"host":"בראד","season":2025},{"date":"2025-02-17","pot":125,"results":{"ניר":30,"שגיא":-120,"תומר":-50,"רון":115,"שלומי":-120,"אילון":70,"כליפא":-80,"גילי":155},"host":"תומר","season":2025},{"date":"2025-02-17","pot":125,"results":{"ניר":-20,"שגיא":50,"תומר":30,"יניב":-20,"רון":-25,"דניאל":10,"אסי":-40,"רם":35,"גילי":-20},"host":"תומר","season":2025},{"date":"2025-02-20","pot":215,"results":{"ניר":-40,"תומר":50,"שראל":150,"רון":-35,"דניאל":-50,"שלומי":-60,"בראדלי":10,"הילאי":5,"גילי":-30},"host":"שלומי","season":2025},{"date":"2025-02-24","pot":320,"results":{"שגיא":-140,"תומר":50,"שראל":85,"יניב":-40,"רון":115,"שלומי":-100,"רם":30,"רועי":-40,"גילי":40},"host":"שגיא","season":2025},{"date":"2025-03-03","pot":285,"results":{"ניר":-40,"תומר":-20,"יניב":40,"רון":-10,"אסי":65,"שלומי":-140,"רם":65,"בראדלי":70,"רועי":-50,"יואב":-25,"גילי":45},"host":"רם","season":2025},{"date":"2025-03-06","pot":180,"results":{"ניר":70,"שגיא":30,"תומר":-20,"רון":20,"דניאל":60,"אסי":-80,"רם":-30,"אילון":-10,"גילי":-40},"host":"גילי","season":2025},{"date":"2025-03-10","pot":170,"results":{"ניר":5,"שגיא":50,"יניב":-40,"רון":90,"שלומי":-15,"רם":-20,"יובל מ.":-40,"בן":25,"גילי":-15,"עודד":-40},"host":"ניר","season":2025},{"date":"2025-03-13","pot":230,"results":{"תומר":35,"שראל":-10,"רון":-80,"שלומי":-60,"בראדלי":-60,"אילון":195,"רועי":-20},"host":"רועי","season":2025},{"date":"2025-03-17","pot":195,"results":{"ניר":20,"תומר":-35,"יניב":30,"רון":15,"אסי":-20,"רונן":-100,"שמוליק":90,"גילי":40,"לירון":-40},"host":"תומר","season":2025},{"date":"2025-03-20","pot":435,"results":{"שגיא":60,"תומר":-40,"שראל":5,"רון":125,"שלומי":-300,"רם":200,"בראדלי":-55,"יובל מ.":-40,"גילי":45},"host":"גילי","season":2025},{"date":"2025-03-24","pot":265,"results":{"שגיא":-40,"תומר":-40,"יניב":-5,"רון":165,"דניאל":-60,"שלומי":-20,"רם":25,"אלון":-50,"רועי":-50,"גילי":75},"host":"יניב","season":2025},{"date":"2025-03-27","pot":275,"results":{"שגיא":-40,"תומר":10,"רון":-100,"אלון":5,"בראדלי":-10,"אילון":220,"שליו":-80,"גילי":40,"עודד":-45},"host":"שגיא","season":2025},{"date":"2025-03-31","pot":170,"results":{"ניר":90,"שגיא":-60,"תומר":-35,"רון":-35,"דניאל":15,"רם":40,"בראדלי":25,"רועי":-20,"נדב":-20},"host":"דניאל","season":2025},{"date":"2025-04-05","pot":200,"results":{"ניר":-20,"שגיא":-90,"תומר":60,"שראל":-20,"יניב":-60,"רון":80,"שלומי":-10,"אילון":50,"גילי":10},"host":"שגיא","season":2025},{"date":"2025-04-10","pot":160,"results":{"שגיא":-10,"תומר":35,"שראל":-80,"רון":30,"אסי":-20,"שלומי":-20,"רם":20,"בראדלי":75,"רועי":-30},"host":"רון","season":2025},{"date":"2025-04-14","pot":165,"results":{"שגיא":5,"שראל":30,"רון":-10,"שלומי":35,"רם":15,"אלון":-45,"בראדלי":-100,"גילי":-10,"עודד":80},"host":"עודד","season":2025},{"date":"2025-04-17","pot":235,"results":{"ניר":100,"שגיא":-90,"רון":15,"אסי":-60,"רם":-80,"אילון":95,"בן":25,"גילי":-5},"host":"ניר","season":2025},{"date":"2025-04-21","pot":255,"results":{"ניר":-40,"שגיא":100,"תומר":50,"יניב":-15,"רון":15,"דניאל":-60,"שלומי":-80,"רם":-60,"רועי":10,"גילי":80},"host":"שגיא","season":2025},{"date":"2025-04-24","pot":230,"results":{"שגיא":15,"תומר":-15,"שראל":65,"דניאל":55,"שלומי":-120,"רם":70,"אילון":25,"הילאי":-20,"יובל מ.":-60,"גילי":-15},"host":"שלומי","season":2025},{"date":"2025-04-28","pot":195,"results":{"ניר":-60,"שגיא":-40,"תומר":-10,"יניב":-50,"רון":-15,"רם":35,"בראדלי":-20,"גילי":160},"host":"תומר","season":2025},{"date":"2025-05-01","pot":215,"results":{"ניר":-80,"שגיא":-20,"שראל":125,"רון":80,"דניאל":-40,"אלון":-35,"רועי":-40,"גילי":10},"host":"גילי","season":2025},{"date":"2025-05-05","pot":210,"results":{"שגיא":-50,"תומר":-5,"יניב":40,"רון":-25,"אסי":-20,"שלומי":10,"רם":130,"בראדלי":-10,"רועי":30,"גילי":-100},"host":"בראדלי","season":2025},{"date":"2025-05-12","pot":285,"results":{"שגיא":-140,"תומר":20,"דניאל":90,"רם":105,"אלון":-25,"רועי":55,"גילי":15,"לירון":-120},"host":"שגיא","season":2025},{"date":"2025-05-15","pot":265,"results":{"שגיא":-40,"תומר":-65,"שראל":-20,"רון":-25,"דניאל":-10,"שלומי":-40,"בראדלי":20,"אילון":245,"גילי":-40,"עודד":-25},"host":"דניאל","season":2025},{"date":"2025-05-19","pot":270,"results":{"שגיא":-100,"תומר":25,"יניב":100,"רון":90,"שלומי":30,"רם":25,"שמוליק":-120,"רועי":-10,"גילי":-40},"host":"תומר","season":2025},{"date":"2025-05-22","pot":230,"results":{"שגיא":15,"תומר":-20,"שראל":-30,"דניאל":-100,"שלומי":175,"בראדלי":-20,"אילון":-60,"יובל מ.":40},"host":"יובל מ.","season":2025},{"date":"2025-05-26","pot":290,"results":{"שגיא":170,"תומר":-120,"רון":-80,"דניאל":55,"אסי":-60,"שלומי":30,"רם":-10,"רועי":-20,"גילי":35},"host":"תומר","season":2025},{"date":"2025-06-02","pot":230,"results":{"ניר":100,"שגיא":-100,"תומר":-20,"יניב":45,"רון":-30,"דניאל":10,"רם":75,"בן":-60,"גילי":-20},"host":"ניר","season":2025},{"date":"2025-06-05","pot":210,"results":{"ניר":-10,"שגיא":-35,"תומר":10,"שראל":35,"רון":-60,"דניאל":-20,"אלון":55,"בראדלי":-25,"רועי":10,"גילי":100,"עודד":-60},"host":"רועי","season":2025},{"date":"2025-06-09","pot":215,"results":{"שגיא":-60,"רון":20,"אסי":30,"שלומי":-20,"רם":155,"רועי":-75,"יואב":-60,"גילי":10},"host":"רם","season":2025},{"date":"2025-06-12","pot":180,"results":{"ניר":-60,"שגיא":-40,"רון":50,"רם":55,"בראדלי":50,"אילון":25,"אבי":-80},"host":"תומר","season":2025},{"date":"2025-06-19","pot":325,"results":{"שגיא":-5,"תומר":30,"יניב":-10,"רון":140,"דניאל":-40,"אסי":25,"שלומי":-180,"רם":-80,"בראדלי":50,"אילון":5,"הילאי":-10,"רועי":75},"host":"שלומי","season":2025},{"date":"2025-06-26","pot":310,"results":{"ניר":-60,"שגיא":-120,"יניב":75,"רון":-15,"שלומי":-95,"רם":90,"בראדלי":90,"אילון":55,"גילי":-20},"host":"גילי","season":2025},{"date":"2025-06-30","pot":300,"results":{"שגיא":-25,"תומר":110,"יניב":25,"רון":-55,"רם":-85,"אלון":30,"איתמר":-135,"רועי":105,"גילי":30},"host":"תומר","season":2025},{"date":"2025-07-03","pot":275,"results":{"תומר":85,"שראל":-100,"יניב":20,"רון":-15,"דניאל":5,"שלומי":-80,"בראדלי":25,"אילון":55,"גילי":85,"עודד":-80},"host":"דניאל","season":2025},{"date":"2025-07-07","pot":195,"results":{"ניר":-60,"שגיא":70,"תומר":30,"יניב":10,"רון":55,"אסי":-25,"שלומי":30,"בראדלי":-70,"גילי":-40},"host":"שגיא","season":2025},{"date":"2025-07-14","pot":170,"results":{"שגיא":-100,"תומר":35,"יניב":35,"רון":-30,"דניאל":30,"רם":-40,"אילון":70},"host":"רון","season":2025},{"date":"2025-07-17","pot":225,"results":{"שגיא":-20,"תומר":-50,"שראל":65,"רון":-80,"דניאל":90,"שלומי":5,"בראדלי":-35,"רועי":65,"גילי":-40},"host":"בראדלי","season":2025},{"date":"2025-07-21","pot":230,"results":{"ניר":-10,"שגיא":-75,"תומר":25,"יניב":110,"רון":10,"דניאל":-80,"אסי":35,"שלומי":-65,"רם":20,"גילי":30},"host":"יניב","season":2025},{"date":"2025-07-24","pot":325,"results":{"רון":25,"אסי":-105,"שלומי":-120,"רם":50,"אלון":160,"בראדלי":5,"אילון":-100,"יואב":80,"גילי":5},"host":"רם","season":2025},{"date":"2025-07-28","pot":240,"results":{"שגיא":-100,"תומר":-40,"רון":-25,"שלומי":40,"רם":105,"בראדלי":5,"אילון":-75,"רונן":60,"גילי":30},"host":"שלומי","season":2025},{"date":"2025-07-31","pot":290,"results":{"ניר":-10,"שגיא":-60,"שראל":-40,"רון":-100,"אסי":40,"שלומי":70,"בראדלי":-80,"אילון":120,"גילי":60},"host":"רון","season":2025},{"date":"2025-08-04","pot":385,"results":{"שגיא":-85,"תומר":-60,"יניב":-40,"רון":-30,"אסי":-40,"רם":30,"אלון":-130,"אילון":230,"שמוליק":20,"יואב":95,"גילי":10},"host":"רם","season":2025},{"date":"2025-08-07","pot":240,"results":{"שגיא":10,"תומר":-40,"שראל":20,"רון":25,"אסי":145,"שלומי":-80,"רם":40,"אילון":-80,"גילי":-40},"host":"תומר","season":2025},{"date":"2025-08-11","pot":220,"results":{"שגיא":-30,"רון":150,"אסי":-40,"שלומי":20,"רם":-60,"אלון":-70,"שליו":50,"עידן":-20},"host":"שגיא","season":2025},{"date":"2025-08-18","pot":440,"results":{"שגיא":-60,"רון":-100,"דניאל":335,"שלומי":-120,"רם":105,"אלון":-20,"אילון":-40,"יואב":-50,"גילי":-50},"host":"רם","season":2025},{"date":"2025-08-21","pot":245,"results":{"שגיא":95,"שראל":135,"רון":-40,"שלומי":-80,"אלון":-40,"בראדלי":-40,"אילון":-45,"גילי":15},"host":"גילי","season":2025},{"date":"2025-08-25","pot":125,"results":{"שגיא":-40,"תומר":5,"יניב":-35,"רון":80,"דניאל":30,"רועי":10,"בן":-40,"גילי":-10},"host":"ניר","season":2025},{"date":"2025-08-28","pot":325,"results":{"ניר":-60,"תומר":10,"שראל":-120,"יניב":-50,"רון":-15,"אסי":35,"אלון":245,"אילון":35,"גילי":-80},"host":"שראל","season":2025},{"date":"2025-09-01","pot":225,"results":{"ניר":40,"תומר":45,"יניב":-60,"רון":40,"בראדלי":-20,"אילון":-30,"שמוליק":100,"רועי":-60,"גילי":-20,"לירון":-35},"host":"בראדלי","season":2025},{"date":"2025-09-04","pot":145,"results":{"שראל":-35,"רון":30,"בראדלי":10,"אילון":60,"גילי":45,"עודד":-100,"שחר":-10},"host":"עודד","season":2025},{"date":"2025-09-08","pot":270,"results":{"שגיא":145,"תומר":-55,"יניב":15,"רון":-45,"אסי":15,"שלומי":-120,"רם":95,"רועי":-40,"גילי":-10},"host":"יניב","season":2025},{"date":"2025-09-11","pot":215,"results":{"שגיא":125,"תומר":65,"שראל":-50,"רון":-60,"שלומי":-35,"אילון":-20,"רועי":-50,"גילי":25},"host":"רועי","season":2025},{"date":"2025-09-15","pot":220,"results":{"ניר":-20,"שגיא":-50,"תומר":-35,"יניב":35,"רון":-40,"שלומי":110,"רם":-50,"בראדלי":-10,"רועי":-15,"גילי":75},"host":"שלומי","season":2025},{"date":"2025-09-18","pot":160,"results":{"תומר":20,"שראל":-30,"יניב":-50,"רון":-35,"רם":-25,"אילון":75,"יובל מ.":-20,"גילי":65},"host":"רון","season":2025},{"date":"2025-09-23","pot":165,"results":{"שגיא":35,"תומר":-5,"שראל":70,"אסי":-60,"שלומי":-40,"אילון":60,"עודד":-60},"host":"תומר","season":2025},{"date":"2025-09-25","pot":175,"results":{"ניר":30,"שגיא":5,"רון":5,"אסי":95,"רם":40,"אלון":-65,"בראדלי":-40,"גילי":-10,"עודד":-60},"host":"שגיא","season":2025},{"date":"2025-09-29","pot":110,"results":{"ניר":40,"שגיא":-50,"תומר":15,"יניב":-40,"אסי":10,"רם":15,"יואב":30,"גילי":-20},"host":"רם","season":2025},{"date":"2025-10-05","pot":360,"results":{"ניר":-80,"שגיא":-80,"תומר":-80,"יניב":-40,"דניאל":-40,"שלומי":100,"רם":235,"רועי":25,"גילי":-40},"host":"שגיא","season":2025},{"date":"2025-10-13","pot":315,"results":{"ניר":60,"תומר":10,"דניאל":-60,"אסי":-15,"שלומי":-85,"רם":90,"בראדלי":65,"אילון":90,"גילי":-15,"עודד":-140},"host":"אסי","season":2025},{"date":"2025-10-16","pot":285,"results":{"שגיא":45,"תומר":50,"שראל":25,"יניב":-60,"רון":160,"בראדלי":-5,"אילון":5,"רועי":-100,"יובל מ.":-90,"גילי":-30},"host":"שגיא","season":2025},{"date":"2025-10-20","pot":330,"results":{"ניר":90,"שגיא":40,"תומר":-10,"רון":85,"אסי":-60,"רם":40,"אילון":-40,"רועי":-60,"יואב":-80,"גילי":75,"עודד":-80},"host":"רם","season":2025},{"date":"2025-10-23","pot":330,"results":{"שגיא":45,"תומר":-20,"שראל":80,"רון":70,"דניאל":-30,"שלומי":-120,"רם":5,"בראדלי":5,"אילון":-60,"גילי":125,"דני":-100},"host":"גילי","season":2025},{"date":"2025-10-27","pot":420,"results":{"ניר":20,"שגיא":-100,"תומר":-60,"יניב":30,"רון":155,"דניאל":-20,"שלומי":-120,"רם":155,"רועי":-100,"גילי":60,"עודד":-20},"host":"רועי","season":2025},{"date":"2025-10-30","pot":340,"results":{"ניר":-20,"שגיא":45,"תומר":15,"שראל":-70,"יניב":-35,"רון":65,"אסי":-40,"רם":-80,"בראדלי":-20,"אילון":195,"גילי":-75,"עודד":20},"host":"בראדלי","season":2025},{"date":"2025-11-03","pot":145,"results":{"רון":-60,"דניאל":5,"אלון":45,"שמוליק":-60,"עודד":-25,"שחר":20,"דני":75},"host":"עודד","season":2025},{"date":"2025-11-06","pot":195,"results":{"תומר":15,"שראל":70,"רון":45,"דניאל":-20,"אסי":-60,"שלומי":-100,"רם":30,"בראדלי":-15,"נדב":35},"host":"דניאל","season":2025},{"date":"2025-11-10","pot":180,"results":{"ניר":40,"שגיא":25,"תומר":-20,"רון":10,"רם":65,"אילון":-60,"רונן":20,"גילי":15,"עודד":5,"דני":-100},"host":"תומר","season":2025},{"date":"2025-11-13","pot":330,"results":{"שגיא":115,"תומר":80,"שראל":30,"רון":-80,"דניאל":-75,"אסי":-40,"שלומי":75,"בראדלי":25,"גילי":5,"דני":-135},"host":"שגיא","season":2025},{"date":"2025-11-17","pot":160,"results":{"תומר":5,"רם":5,"אילון":10,"שמוליק":-85,"בן":-60,"לירון":-15,"דני":140},"host":"ניר","season":2025},{"date":"2025-11-20","pot":220,"results":{"ניר":50,"תומר":-40,"שראל":-30,"יניב":-5,"רון":-10,"שלומי":-10,"אלון":170,"אילון":-65,"גילי":-60},"host":"שלומי","season":2025},{"date":"2025-11-24","pot":215,"results":{"שגיא":-80,"תומר":-15,"יניב":-40,"רון":25,"דניאל":10,"רם":180,"אילון":-15,"רועי":-50,"גילי":-15},"host":"רון","season":2025},{"date":"2025-11-27","pot":340,"results":{"שגיא":-40,"תומר":-5,"רון":50,"דניאל":65,"רם":-35,"בראדלי":25,"אילון":-80,"רונן":200,"יואב":-60,"גילי":-60,"עודד":-60},"host":"רם","season":2025},{"date":"2025-12-01","pot":295,"results":{"שגיא":-95,"תומר":10,"יניב":15,"רון":15,"אסי":-110,"שלומי":80,"אלון":-100,"אילון":160,"רועי":15,"גילי":-35,"דני":45},"host":"אסי","season":2025},{"date":"2025-12-04","pot":245,"results":{"ניר":50,"תומר":35,"יניב":-50,"רון":40,"שלומי":120,"רם":-55,"בראדלי":-40,"גילי":-20,"דני":-80},"host":"יניב","season":2025},{"date":"2025-12-08","pot":210,"results":{"תומר":40,"רון":-20,"דניאל":-60,"רם":15,"אלון":70,"אילון":35,"רועי":50,"יובל מ.":-50,"דני":-80},"host":"יובל מ.","season":2025},{"date":"2025-12-11","pot":300,"results":{"ניר":-40,"תומר":-35,"שראל":-60,"רון":-20,"דניאל":20,"אסי":-90,"שלומי":140,"רם":140,"בראדלי":-20,"אילון":-15,"גילי":-20},"host":"דניאל","season":2025},{"date":"2025-12-18","pot":190,"results":{"שגיא":-80,"שראל":-60,"רון":-15,"דניאל":30,"שלומי":65,"בראדלי":-15,"רועי":-20,"גילי":95},"host":"גילי","season":2025},{"date":"2025-12-22","pot":175,"results":{"שגיא":-60,"תומר":45,"רון":20,"דניאל":60,"שלומי":-75,"רם":50,"רועי":-40},"host":"שגיא","season":2025},{"date":"2025-12-25","pot":265,"results":{"תומר":-5,"שראל":-60,"רון":-80,"דניאל":40,"אסי":-15,"שלומי":80,"רם":60,"אילון":-25,"גילי":85,"דני":-80},"host":"אסי","season":2025},{"date":"2025-12-29","pot":315,"results":{"שגיא":145,"תומר":-40,"רון":-60,"דניאל":-20,"אסי":-80,"רם":-100,"רועי":170,"גילי":-40,"עודד":-40,"דני":65},"host":"דני","season":2025},{"date":"2026-01-01","pot":240,"results":{"שגיא":-40,"תומר":95,"שראל":-60,"יניב":-15,"רון":80,"רם":-60,"בראדלי":-5,"גילי":-60,"וולין":65},"host":"וולין","season":2026},{"date":"2026-01-05","pot":295,"results":{"שגיא":-80,"תומר":85,"יניב":20,"רון":-10,"אסי":30,"שלומי":160,"רונן":-60,"רועי":-80,"גילי":-5,"וולין":-60},"host":"רועי","season":2026},{"date":"2026-01-08","pot":330,"results":{"רון":-45,"דניאל":-40,"אסי":-100,"שלומי":-10,"רם":55,"בראדלי":-55,"אילון":15,"יואב":80,"גילי":100,"וולין":80,"דני":-80},"host":"רם","season":2026},{"date":"2026-01-12","pot":120,"results":{"ניר":20,"שגיא":40,"תומר":10,"רון":50,"אסי":-35,"רועי":-45,"גילי":-40},"host":"אסי","season":2026},{"date":"2026-01-15","pot":290,"results":{"תומר":-10,"יניב":-15,"רון":-40,"אסי":-20,"שלומי":-120,"רם":80,"בראדלי":-5,"אילון":35,"רועי":-80,"גילי":30,"דני":145},"host":"בראדלי","season":2026},{"date":"2026-01-19","pot":90,"results":{"תומר":10,"יניב":20,"רון":30,"בראדלי":-55,"רועי":-10,"יואב":20,"גילי":10,"דני":-25},"host":"רם","season":2026},{"date":"2026-01-22","pot":200,"results":{"ניר":-40,"שגיא":-80,"תומר":5,"שראל":90,"רם":-20,"אילון":80,"גילי":25,"אלירן":-60},"host":"גילי","season":2026},{"date":"2026-02-02","pot":135,"results":{"ניר":50,"שגיא":-40,"תומר":20,"יניב":-20,"רון":10,"דניאל":-5,"רם":45,"אילון":10,"רועי":-45,"גילי":-5,"וולין":-20},"host":"שגיא","season":2026},{"date":"2026-02-05","pot":210,"results":{"תומר":-45,"שראל":30,"רון":-15,"דניאל":150,"רם":-40,"גילי":30,"לירון":-10,"דני":-100},"host":"רון","season":2026},{"date":"2026-02-09","pot":200,"results":{"שגיא":100,"תומר":20,"יניב":35,"רון":-50,"דניאל":-30,"אסי":-65,"רם":-20,"רועי":-5,"גילי":-30,"דני":45},"host":"דניאל","season":2026},{"date":"2026-02-12","pot":180,"results":{"שגיא":-30,"תומר":20,"שראל":30,"רון":15,"דניאל":30,"שלומי":70,"בראדלי":15,"אילון":-30,"יובל מ.":-80,"גילי":-40},"host":"תומר","season":2026},{"date":"2026-02-16","pot":265,"results":{"ניר":40,"שגיא":-80,"תומר":55,"רון":-20,"רונן":35,"שמוליק":10,"רועי":75,"בן":50,"גילי":-80,"וולין":-20,"דני":-65},"host":"ניר","season":2026},{"date":"2026-02-19","pot":140,"results":{"תומר":20,"שראל":10,"רון":-20,"רם":15,"בראדלי":30,"אילון":65,"גילי":-10,"וולין":-40,"דני":-90},"host":"דני","season":2026},{"date":"2026-02-23","pot":370,"results":{"ניר":90,"שגיא":-40,"תומר":-25,"יניב":40,"רון":170,"שלומי":-80,"רם":70,"רועי":-40,"גילי":-75,"וולין":-80,"דני":-10},"host":"וולין","season":2026},{"date":"2026-02-26","pot":190,"results":{"ניר":-40,"תומר":40,"רון":30,"שלומי":45,"רם":-70,"בראדלי":10,"אילון":-20,"יואב":-60,"גילי":65},"host":"רם","season":2026},{"date":"2026-03-02","pot":170,"results":{"ניר":70,"שגיא":-35,"תומר":40,"שראל":5,"יניב":-10,"רון":5,"דניאל":50,"אסי":-35,"רועי":-20,"גילי":-45,"וולין":-25},"host":"אסי","season":2026},{"date":"2026-03-05","pot":295,"results":{"ניר":70,"שגיא":130,"תומר":-60,"רון":-30,"דניאל":20,"אסי":-40,"שלומי":-105,"רם":-30,"בראדלי":45,"אילון":5,"גילי":25,"וולין":-25},"host":"שלומי","season":2026},{"date":"2026-03-09","pot":325,"results":{"ניר":-40,"שגיא":115,"יניב":10,"רון":-40,"דניאל":-20,"אסי":70,"שלומי":-20,"רונן":-10,"שמוליק":130,"בן":-55,"גילי":-40,"וולין":-100},"host":"ניר","season":2026},{"date":"2026-03-12","pot":415,"results":{"שגיא":-105,"שראל":-80,"יניב":60,"רון":-60,"דניאל":-40,"אסי":-100,"שלומי":115,"רם":50,"בראדלי":125,"אילון":65,"גילי":-30},"host":"בראדלי","season":2026},{"date":"2026-03-16","pot":195,"results":{"ניר":30,"שגיא":-20,"תומר":20,"יניב":-75,"רון":15,"שלומי":60,"רועי":20,"גילי":50,"וולין":-20,"דני":-80},"host":"רועי","season":2026},{"date":"2026-03-19","pot":115,"results":{"שראל":-30,"רון":15,"דניאל":10,"אלון":-80,"בראדלי":30,"אילון":-5,"גילי":60},"host":"שראל","season":2026},{"date":"2026-03-23","pot":220,"results":{"שגיא":-15,"תומר":35,"יניב":5,"רון":-25,"שלומי":-120,"אילון":65,"רועי":10,"יובל מ.":55,"גילי":50,"דני":-60},"host":"יובל מ.","season":2026},{"date":"2026-03-26","pot":360,"results":{"שגיא":255,"תומר":-60,"שראל":-100,"יניב":60,"רון":5,"דניאל":-10,"רם":-50,"בראדלי":-10,"אילון":40,"גילי":-50,"וולין":-80},"host":"גילי","season":2026},{"date":"2026-03-30","pot":495,"results":{"ניר":170,"שגיא":-200,"יניב":-60,"רון":-25,"אסי":-40,"שלומי":-100,"אלון":-70,"רועי":5,"גילי":30,"וולין":75,"דני":215},"host":"וולין","season":2026},{"date":"2026-04-02","pot":290,"results":{"ניר":-60,"שגיא":175,"תומר":-30,"שראל":5,"יניב":35,"רון":-50,"דניאל":20,"אסי":-60,"רם":-25,"אילון":55,"גילי":-5,"דני":-60},"host":"יניב","season":2026},{"date":"2026-04-06","pot":485,"results":{"ניר":-60,"שגיא":-60,"תומר":65,"רון":80,"אסי":45,"שלומי":-160,"רם":185,"אלון":-70,"בראדלי":110,"רועי":-80,"גילי":-55},"host":"שגיא","season":2026},{"date":"2026-04-09","pot":190,"results":{"ניר":-40,"תומר":95,"שראל":15,"יניב":65,"רון":-5,"רם":-60,"אילון":15,"גילי":-15,"וולין":-25,"דני":-45},"host":"רון","season":2026},{"date":"2026-04-12","pot":380,"results":{"שגיא":130,"תומר":25,"יניב":-60,"רון":-40,"דניאל":-10,"אסי":-65,"שלומי":-160,"רם":175,"רועי":-25,"גילי":-20,"דני":50},"host":"רם","season":2026},{"date":"2026-04-16","pot":290,"results":{"שגיא":-100,"תומר":-80,"שראל":85,"יניב":20,"רון":-55,"דניאל":-15,"אסי":-20,"שלומי":90,"רם":40,"בראדלי":-20,"אילון":50,"גילי":5},"host":"דניאל","season":2026},{"date":"2026-04-19","pot":325,"results":{"שגיא":-105,"יניב":-40,"רון":10,"דניאל":20,"רם":155,"אלון":85,"רועי":-20,"גילי":55,"וולין":-60,"דני":-100},"host":"דני","season":2026}];

const ALL_INITIAL_SESSIONS = ALL_HISTORICAL_SESSIONS;

// ===== רשימת אירוחים מתוכננים (מה-Google Sheet) =====
const HOSTING_SCHEDULE = [{"date": "2025-08-11", "dayName": "שני", "host": "שגיא", "notes": "התקיים"}, {"date": "2025-08-14", "dayName": "חמישי", "host": null, "notes": "לא היה משחק"}, {"date": "2025-08-18", "dayName": "שני", "host": "אילון", "notes": "רם אירח, אילון קנה אירוח"}, {"date": "2025-08-21", "dayName": "חמישי", "host": "גילי", "notes": "התקיים"}, {"date": "2025-08-25", "dayName": "שני", "host": "ניר", "notes": "התקיים"}, {"date": "2025-08-28", "dayName": "חמישי", "host": "שראל", "notes": "התקיים"}, {"date": "2025-09-01", "dayName": "שני", "host": "בראדלי", "notes": "התקיים"}, {"date": "2025-09-04", "dayName": "חמישי", "host": "וולין", "notes": "התקיים"}, {"date": "2025-09-08", "dayName": "שני", "host": "יניב", "notes": "התקיים"}, {"date": "2025-09-11", "dayName": "חמישי", "host": "רועי", "notes": "התקיים"}, {"date": "2025-09-15", "dayName": "שני", "host": "שלומי", "notes": "התקיים"}, {"date": "2025-09-18", "dayName": "חמישי", "host": "רון", "notes": "התקיים"}, {"date": "2025-09-22", "dayName": "שני", "host": "תומר", "notes": "ראש השנה"}, {"date": "2025-09-25", "dayName": "חמישי", "host": "אלון", "notes": "שגיא מילא מקומו"}, {"date": "2025-09-29", "dayName": "שני", "host": "רם", "notes": "התקיים"}, {"date": "2025-10-02", "dayName": "חמישי", "host": null, "notes": "יום כיפור לא התקיים"}, {"date": "2025-10-05", "dayName": "ראשון", "host": "שגיא", "notes": "התקיים"}, {"date": "2025-10-08", "dayName": "חמישי", "host": "אסף", "notes": "התקיים"}, {"date": "2025-10-16", "dayName": "חמישי", "host": "יובל מ.", "notes": "שגיא אירח במקום"}, {"date": "2025-10-20", "dayName": "שני", "host": "אילון", "notes": "רם אירח, אילון קנה אירוח"}, {"date": "2025-10-23", "dayName": "חמישי", "host": "גילי", "notes": "התקיים"}, {"date": "2025-10-27", "dayName": "שני", "host": "רועי", "notes": "התקיים"}, {"date": "2025-10-30", "dayName": "חמישי", "host": "בראדלי", "notes": "התקיים"}, {"date": "2025-11-03", "dayName": "שני", "host": "וולין", "notes": "התקיים"}, {"date": "2025-11-06", "dayName": "חמישי", "host": "דניאל", "notes": "התקיים"}, {"date": "2025-11-10", "dayName": "שני", "host": "יניב", "notes": "תומר אירח"}, {"date": "2025-11-13", "dayName": "חמישי", "host": "שראל", "notes": "שגיא אירח"}, {"date": "2025-11-17", "dayName": "שני", "host": "ניר", "notes": "התקיים"}, {"date": "2025-11-20", "dayName": "חמישי", "host": "שלומי", "notes": "התקיים"}, {"date": "2025-11-24", "dayName": "שני", "host": "רון", "notes": "התקיים"}, {"date": "2025-11-27", "dayName": "חמישי", "host": "רם", "notes": "התקיים"}, {"date": "2025-12-01", "dayName": "שני", "host": "אלון", "notes": "אסף אירח"}, {"date": "2025-12-04", "dayName": "חמישי", "host": "יניב", "notes": "התקיים"}, {"date": "2025-12-08", "dayName": "שני", "host": "יובל מ.", "notes": "התקיים"}, {"date": "2025-12-11", "dayName": "חמישי", "host": "דניאל", "notes": "התקיים"}, {"date": "2025-12-15", "dayName": "שני", "host": "שגיא", "notes": "לא התקיים"}, {"date": "2025-12-18", "dayName": "חמישי", "host": "גילי", "notes": "התקיים"}, {"date": "2025-12-22", "dayName": "שני", "host": "שגיא", "notes": "התקיים"}, {"date": "2025-12-25", "dayName": "חמישי", "host": "אסף", "notes": "התקיים"}, {"date": "2025-12-29", "dayName": "שני", "host": "דני", "notes": "התקיים"}, {"date": "2026-01-01", "dayName": "חמישי", "host": "וולין", "notes": "התקיים"}, {"date": "2026-01-05", "dayName": "שני", "host": "רועי", "notes": "התקיים"}, {"date": "2026-01-08", "dayName": "חמישי", "host": "רם", "notes": "התקיים"}, {"date": "2026-01-12", "dayName": "שני", "host": "שראל", "notes": "התקיים אצל אסף"}, {"date": "2026-01-15", "dayName": "חמישי", "host": "בראדלי", "notes": "התקיים"}, {"date": "2026-01-19", "dayName": "שני", "host": "אילון", "notes": "התקיים"}, {"date": "2026-01-22", "dayName": "חמישי", "host": "יניב", "notes": "התקיים אצל גילי"}, {"date": "2026-01-26", "dayName": "שני", "host": "גילי", "notes": "התקיים"}, {"date": "2026-01-29", "dayName": "חמישי", "host": "אסי", "notes": "התקיים"}, {"date": "2026-02-02", "dayName": "שני", "host": "שגיא", "notes": "התקיים"}, {"date": "2026-02-05", "dayName": "חמישי", "host": "רון", "notes": "התקיים"}, {"date": "2026-02-09", "dayName": "שני", "host": "דניאל", "notes": "התקיים"}, {"date": "2026-02-12", "dayName": "חמישי", "host": "תומר", "notes": "התקיים"}, {"date": "2026-02-16", "dayName": "שני", "host": "ניר", "notes": "התקיים"}, {"date": "2026-02-19", "dayName": "חמישי", "host": "דני", "notes": "התקיים"}, {"date": "2026-02-23", "dayName": "שני", "host": "אסף", "notes": "אילון מילא מקום"}, {"date": "2026-02-26", "dayName": "חמישי", "host": "אילון", "notes": "התקיים"}, {"date": "2026-03-02", "dayName": "שני", "host": "אסף", "notes": "התקיים"}, {"date": "2026-03-05", "dayName": "חמישי", "host": "שלומי", "notes": "התקיים"}, {"date": "2026-03-09", "dayName": "שני", "host": "ניר", "notes": "התקיים"}, {"date": "2026-03-12", "dayName": "חמישי", "host": "בראדלי", "notes": "התקיים"}, {"date": "2026-03-16", "dayName": "שני", "host": "רועי", "notes": "התקיים"}, {"date": "2026-03-19", "dayName": "חמישי", "host": "שראל", "notes": "התקיים"}, {"date": "2026-03-23", "dayName": "שני", "host": "יובל מ.", "notes": "התקיים"}, {"date": "2026-03-26", "dayName": "חמישי", "host": "גילי", "notes": "התקיים"}, {"date": "2026-03-30", "dayName": "שני", "host": "וולין", "notes": "התקיים"}, {"date": "2026-04-02", "dayName": "חמישי", "host": "יניב", "notes": "התקיים"}, {"date": "2026-04-06", "dayName": "שני", "host": "שגיא", "notes": "רון אירח"}, {"date": "2026-04-09", "dayName": "חמישי", "host": "אלון", "notes": "רון אירח"}, {"date": "2026-04-13", "dayName": "שני", "host": "רם", "notes": "התקיים"}, {"date": "2026-04-16", "dayName": "חמישי", "host": "דניאל", "notes": "התקיים"}, {"date": "2026-04-20", "dayName": "שני", "host": "דני", "notes": "התקיים"}, {"date": "2026-04-23", "dayName": "חמישי", "host": "יובל מ.", "notes": "יובל מילוא אירח"}, {"date": "2026-04-27", "dayName": "שני", "host": "אסף", "notes": null}, {"date": "2026-04-30", "dayName": "חמישי", "host": "שגיא", "notes": null}, {"date": "2026-05-04", "dayName": "שני", "host": "אילון", "notes": null}, {"date": "2026-05-07", "dayName": "חמישי", "host": "רועי", "notes": null}, {"date": "2026-05-11", "dayName": "שני", "host": "שראל", "notes": null}, {"date": "2026-05-14", "dayName": "חמישי", "host": "ניר", "notes": null}, {"date": "2026-05-18", "dayName": "שני", "host": "בראדלי", "notes": null}, {"date": "2026-05-21", "dayName": "חמישי", "host": "וולין", "notes": null}, {"date": "2026-05-25", "dayName": "שני", "host": "יניב", "notes": null}, {"date": "2026-05-28", "dayName": "חמישי", "host": "גילי", "notes": null}, {"date": "2026-06-01", "dayName": "שני", "host": "רון", "notes": null}, {"date": "2026-06-04", "dayName": "חמישי", "host": "אלון", "notes": null}];
// ===== 975 ציטוטים מהוואטסאפ =====
const ALL_QUOTES = [{"date": "22.4.2026", "quoter": "תומר", "quoted": "רון", "text": "אשת כנפה מי ימצא ( וזה דפנה תזכרה לרישום ❤️😉 )", "id": 1}, {"date": "20.4.2026", "quoter": "יניב", "quoted": "תומר", "text": "שום עזרה לא תעזור", "id": 2}, {"date": "12.4.2026", "quoter": "תומר", "quoted": "רון", "text": "אין על מי לסמוך אלא על חוסר הזיכרון", "id": 3}, {"date": "10.4.2026", "quoter": "רון", "quoted": "תומר", "text": "נססרי לחלוטין", "id": 4}, {"date": "10.4.2026", "quoter": "יניב", "quoted": "תומר", "text": "necessary לחלוטין", "id": 5}, {"date": "8.4.2026", "quoter": "תומר", "quoted": "רון", "text": "אתה יודע מה זה דפדפן , נכון ?", "id": 6}, {"date": "7.4.2026", "quoter": "תומר", "quoted": "גילי", "text": "אתה מה שצריך לדעת .. זה ההרשמה מחר לחמישי", "id": 7}, {"date": "6.4.2026", "quoter": "תומר", "quoted": "רון", "text": "תראה אותך … אפיפיורוס", "id": 8}, {"date": "31.3.2026", "quoter": "תומר", "quoted": "גילי", "text": "אני לא מבין איפה סופרמן בכל המלחמה הזאתי 🤣", "id": 9}, {"date": "23.3.2026", "quoter": "תומר", "quoted": "יניב", "text": "מה זה בהייטקזון הפר 🐂 🤣", "id": 10}, {"date": "20.3.2026", "quoter": "רון", "quoted": "גילי", "text": "אני מחכה להתאלמן", "id": 11}, {"date": "5.3.2026", "quoter": "תומר", "quoted": "גילי", "text": "לרון … אתה עם המזל שלך יפגע לך בגיד אכילס", "id": 12}, {"date": "5.3.2026", "quoter": "תומר", "quoted": "גילי", "text": "עדר של כבשים פה ללא רועה צאן", "id": 13}, {"date": "3.3.2026", "quoter": "רון", "quoted": "ניר", "text": "אסי, אתה תישבר מהר בכלא הסורי", "id": 14}, {"date": "2.3.2026", "quoter": "תומר", "quoted": "רון", "text": "איך חמי היה אמר … עובד זקוף מתחת לשטיח", "id": 15}, {"date": "23.2.2026", "quoter": "תומר", "quoted": "יניב", "text": "קרח עד", "id": 16}, {"date": "20.2.2026", "quoter": "תומר", "quoted": "רון", "text": "אני בהפוגטו", "id": 17}, {"date": "13.2.2026", "quoter": "רון", "quoted": "תומר", "text": "חוק שימור הכסף", "id": 18}, {"date": "13.2.2026", "quoter": "תומר", "quoted": "רון", "text": "תאר לעצמך שהבן שלך הולך לגן עם יוסי טרנטינו", "id": 19}, {"date": "5.2.2026", "quoter": "תומר", "quoted": "שראל", "text": "אני רון ישנים עד שמתעוררים ☝️", "id": 20}, {"date": "3.2.2026", "quoter": "רון", "quoted": "תומר", "text": "שלשלת יונים", "id": 21}, {"date": "2.2.2026", "quoter": "תומר", "quoted": "דניאל", "text": "עדיף למות על קיבה ריקה", "id": 22}, {"date": "22.1.2026", "quoter": "תומר", "quoted": "גילי", "text": "מגדלי שראל", "id": 23}, {"date": "19.1.2026", "quoter": "תומר", "quoted": "יניב", "text": "יודע מה ה .. ״דמרנקים ״ עושים להם", "id": 24}, {"date": "19.1.2026", "quoter": "תומר", "quoted": "רם", "text": "אני הכי מינוס פה …", "id": 25}, {"date": "19.1.2026", "quoter": "תומר", "quoted": "רון", "text": "מה אני ״דובק״", "id": 26}, {"date": "19.1.2026", "quoter": "תומר", "quoted": "יניב", "text": "״האמסטרדמיות ״", "id": 27}, {"date": "16.1.2026", "quoter": "תומר", "quoted": "בראדלי", "text": "( לרון ) אתה לא חלקאי", "id": 28}, {"date": "16.1.2026", "quoter": "תומר", "quoted": "בראדלי", "text": "משק לואיס 😂", "id": 29}, {"date": "9.1.2026", "quoter": "תומר", "quoted": "רון", "text": "אתה מאוד נפחי", "id": 30}, {"date": "8.1.2026", "quoter": "תומר", "quoted": "גילי", "text": "( שלומי ) … יאלה אין לי כלום אבל אין לי ברירה. 😂", "id": 31}, {"date": "5.1.2026", "quoter": "יניב", "quoted": "רון", "text": "פותחים גמרא", "id": 32}, {"date": "5.1.2026", "quoter": "תומר", "quoted": "רון", "text": "קוניאק של הבזולר", "id": 33}, {"date": "2.1.2026", "quoter": "תומר", "quoted": "יניב", "text": "כל אחד פה הוא בלרינה", "id": 34}, {"date": "29.12.2025", "quoter": "רון", "quoted": "יניב", "text": "בוטנים זה פינאטס", "id": 35}, {"date": "26.12.2025", "quoter": "תומר", "quoted": "דניאל", "text": "מה קראת לה … טונה מעבר לפינה", "id": 36}, {"date": "23.12.2025", "quoter": "תומר", "quoted": "גילי", "text": "וואלק אתה … צ׳רלי צ׳פלין של הפוקר", "id": 37}, {"date": "22.12.2025", "quoter": "תומר", "quoted": "רון", "text": "אני נהייתי קורדוס בספורט ( גורדוס ) 🤦🏼‍♂️", "id": 38}, {"date": "21.12.2025", "quoter": "רון", "quoted": "תומר", "text": "נסענו במכונית עותומנית", "id": 39}, {"date": "21.12.2025", "quoter": "תומר", "quoted": "יניב", "text": "עוד שניה הוא התאסלם", "id": 40}, {"date": "12.12.2025", "quoter": "תומר", "quoted": "רון", "text": "אני הייתי אחראי בצבא על קורנביף ומתוקים", "id": 41}, {"date": "5.12.2025", "quoter": "יניב", "quoted": "שלומי", "text": "אני החלטתי לשנות דיסקית", "id": 42}, {"date": "4.12.2025", "quoter": "תומר", "quoted": "יניב", "text": "לשלומי , אם אתה מפסיד למישהו לאורך זמן …🤦🏼‍♂️", "id": 43}, {"date": "4.12.2025", "quoter": "תומר", "quoted": "יניב", "text": "אם אתה מעיץ ( החלקיקים ) אז איפה תל מונד 🤣 … על מי ולמה נאמר ?", "id": 44}, {"date": "4.12.2025", "quoter": "תומר", "quoted": "יניב", "text": "היית בניצת הדובדבן", "id": 45}, {"date": "4.12.2025", "quoter": "תומר", "quoted": "יניב", "text": "זה כמו שתעשה גולש במכה", "id": 46}, {"date": "21.11.2025", "quoter": "תומר", "quoted": "שראל", "text": "( לאלון ) … בטח חלקה .. דרכת על חשופית", "id": 47}, {"date": "21.11.2025", "quoter": "רון", "quoted": "תומר", "text": "נוסף חוק לחוקה. לא ישתף חבר בתכני הקבוצה לצד ג' לרבות אשתו.", "id": 48}, {"date": "21.11.2025", "quoter": "אלון", "quoted": "תומר", "text": "מפה אפשר רק לעלות", "id": 49}, {"date": "21.11.2025", "quoter": "תומר", "quoted": "רון", "text": "אם אני עובר מפוקר 1 לשבוע ולא פעמיים … אני מרזה", "id": 50}, {"date": "14.11.2025", "quoter": "רון", "quoted": "תומר", "text": "העולם שכולו טוב לא טוב לי", "id": 51}, {"date": "6.11.2025", "quoter": "תומר", "quoted": "רון", "text": "אתה נחמד אבל .. אתה לא הסיפור בסיפור 🤣", "id": 52}, {"date": "4.11.2025", "quoter": "אלון", "quoted": "תומר", "text": "קייט בסנואו", "id": 53}, {"date": "3.11.2025", "quoter": "יניב", "quoted": "תומר", "text": "הפצמרית אמרה לי", "id": 54}, {"date": "24.10.2025", "quoter": "תומר", "quoted": "בראדלי", "text": "פרוט  ני׳נג׳ה", "id": 55}, {"date": "24.10.2025", "quoter": "תומר", "quoted": "רון", "text": "תראה אותי לא ספורט , לא תזונה", "id": 56}, {"date": "17.10.2025", "quoter": "רון", "quoted": "יניב", "text": "זה מסתובב? זה מה חשוב", "id": 57}, {"date": "8.10.2025", "quoter": "תומר", "quoted": "בראדלי", "text": "אין בנאדם אחד לבן על הרצפה", "id": 58}, {"date": "5.10.2025", "quoter": "תומר", "quoted": "יניב", "text": "אני מוחק המון … כואב לי הלב", "id": 59}, {"date": "5.10.2025", "quoter": "רם", "quoted": "תומר", "text": "סוף סוף הרגשה של יד", "id": 60}, {"date": "26.9.2025", "quoter": "תומר", "quoted": "רון", "text": "אני סיעודי … גמרתם אותי", "id": 61}, {"date": "25.9.2025", "quoter": "תומר", "quoted": "ניר", "text": "אל תתן לו רגשות רעים", "id": 62}, {"date": "12.9.2025", "quoter": "תומר", "quoted": "רון", "text": "זה עושה חם בקנה", "id": 63}, {"date": "1.9.2025", "quoter": "רון", "quoted": "תומר", "text": "שמישהו יעשה פה AI", "id": 64}, {"date": "28.8.2025", "quoter": "תומר", "quoted": "רון", "text": "מאפייה שעובדת הרבה שעות", "id": 65}, {"date": "27.8.2025", "quoter": "תומר", "quoted": "יניב", "text": "זב״ם = זיקפת בוקר מבוזבזת", "id": 66}, {"date": "27.8.2025", "quoter": "תומר", "quoted": "יניב", "text": "במוצאי הקמפינג 🤦🏼‍♂️🤣", "id": 67}, {"date": "4.8.2025", "quoter": "תומר", "quoted": "יניב", "text": "זה כמו תחנה מרכזית פה", "id": 68}, {"date": "4.8.2025", "quoter": "תומר", "quoted": "יניב", "text": "שפילברג שאתה ..🤣", "id": 69}, {"date": "28.7.2025", "quoter": "רון", "quoted": "גילי", "text": "שמתחיל שלב הרטיבות, תתמסר", "id": 70}, {"date": "28.7.2025", "quoter": "יניב", "quoted": "רון", "text": "This is my time", "id": 71}, {"date": "21.7.2025", "quoter": "תומר", "quoted": "רון", "text": "זה הרבה דופק", "id": 72}, {"date": "18.7.2025", "quoter": "תומר", "quoted": "רון", "text": "אני כמו פיל בחנות חרסיני", "id": 73}, {"date": "15.7.2025", "quoter": "יניב", "quoted": "תומר", "text": "הלך בן אדם", "id": 74}, {"date": "14.7.2025", "quoter": "תומר", "quoted": "יניב", "text": "צווארון כחול … לא עוסק בפינוי גופות", "id": 75}, {"date": "14.7.2025", "quoter": "יניב", "quoted": "תומר", "text": "סתם הביאו כושי על גחלים", "id": 76}, {"date": "10.7.2025", "quoter": "תומר", "quoted": "רון", "text": "כהה להם הטעם", "id": 77}, {"date": "8.7.2025", "quoter": "תומר", "quoted": "יניב", "text": "או הורידו אותו .. או נפטר מכדור טועה", "id": 78}, {"date": "8.7.2025", "quoter": "תומר", "quoted": "יניב", "text": "דאבח- מול", "id": 79}, {"date": "7.7.2025", "quoter": "תומר", "quoted": "גילי", "text": "הלאה .. פתחת פה חברת נסיעות … דורה", "id": 80}, {"date": "7.7.2025", "quoter": "תומר", "quoted": "יניב", "text": "בא בנאדם ….", "id": 81}, {"date": "7.7.2025", "quoter": "תומר", "quoted": "יניב", "text": "הם לא יודעים מי הפסיד למי", "id": 82}, {"date": "7.7.2025", "quoter": "תומר", "quoted": "רון", "text": "הוא לא מוציא איזה משהו .. ליונל ריצ׳י", "id": 83}, {"date": "1.7.2025", "quoter": "רון", "quoted": "ניר", "text": "אם זה לא סימן אז מה? (תגובה ראשונה להתרסקות)", "id": 84}, {"date": "1.7.2025", "quoter": "אלון", "quoted": "יניב", "text": "עלה לו הקישקע לתחתונים", "id": 85}, {"date": "30.6.2025", "quoter": "יניב", "quoted": "תומר", "text": "יפה שרונן בא להיפרד <ההודעה נערכה>", "id": 86}, {"date": "27.6.2025", "quoter": "רון", "quoted": "תומר", "text": "בתים פתוחים (סווינגרז)", "id": 87}, {"date": "26.6.2025", "quoter": "תומר", "quoted": "רון", "text": "הטוען לכתר , והכתר", "id": 88}, {"date": "26.6.2025", "quoter": "תומר", "quoted": "יניב", "text": "מלמילאנו", "id": 89}, {"date": "9.6.2025", "quoter": "תומר", "quoted": "רון", "text": "גם לי יש בעיה בקטיף …", "id": 90}, {"date": "9.6.2025", "quoter": "תומר", "quoted": "רועי", "text": "הוא כמו עיט לטרף 🤦🏼‍♂️🫣", "id": 91}, {"date": "6.6.2025", "quoter": "אלון", "quoted": "תומר", "text": "זולג דמעות תנין", "id": 92}, {"date": "5.6.2025", "quoter": "אלון", "quoted": "רון", "text": "כמו נחש קוּברה אתה", "id": 93}, {"date": "2.6.2025", "quoter": "תומר", "quoted": "יניב", "text": "זה בדרך כלל חכה בלי חוט", "id": 94}, {"date": "15.5.2025", "quoter": "תומר", "quoted": "רון", "text": "אי אפשר לעשות פו׳גי 😆", "id": 95}, {"date": "13.5.2025", "quoter": "תומר", "quoted": "רון", "text": "חברים מדרוניאקה", "id": 96}, {"date": "12.5.2025", "quoter": "אלון", "quoted": "רון", "text": "קלף שטונדה", "id": 97}, {"date": "12.5.2025", "quoter": "תומר", "quoted": "רון", "text": "אני תמיד אומר ככה …. לא תמיד 😜", "id": 98}, {"date": "6.5.2025", "quoter": "תומר", "quoted": "רון", "text": "כפר סבא זה עיר … לא , זה כפר", "id": 99}, {"date": "6.5.2025", "quoter": "יניב", "quoted": "תומר", "text": "קם הגנן על שלוחותיו", "id": 100}, {"date": "5.5.2025", "quoter": "יניב", "quoted": "תומר", "text": "ימים כלילות", "id": 101}, {"date": "5.5.2025", "quoter": "תומר", "quoted": "יניב", "text": "טום קרוז פרייאר פה", "id": 102}, {"date": "1.5.2025", "quoter": "תומר", "quoted": "יניב", "text": "הזמן טס שמאחרים", "id": 103}, {"date": "28.4.2025", "quoter": "תומר", "quoted": "יניב", "text": "אין לך שום מוטיבציה", "id": 104}, {"date": "22.4.2025", "quoter": "תומר", "quoted": "שגיא", "text": "אני חייב לספר לך משהו … אני הולך להופעה של הבובה", "id": 105}, {"date": "22.4.2025", "quoter": "תומר", "quoted": "רועי", "text": "״יניב עודפים״", "id": 106}, {"date": "10.4.2025", "quoter": "תומר", "quoted": "רון", "text": "שיהיה לך שחור רק בז׳יטונים", "id": 107}, {"date": "10.4.2025", "quoter": "תומר", "quoted": "רון", "text": "( לשראל ) נהיית פרמדוג <ההודעה נערכה>", "id": 108}, {"date": "5.4.2025", "quoter": "תומר", "quoted": "יניב", "text": "מי המורה … רוזה ברחשייין", "id": 109}, {"date": "1.4.2025", "quoter": "תומר", "quoted": "יניב", "text": "אני בטיול צופים הכרתי  המון הורים חדשים … הורות חדשות 😂", "id": 110}, {"date": "1.4.2025", "quoter": "תומר", "quoted": "יניב", "text": "חכה בלי חוט 🤣", "id": 111}, {"date": "31.3.2025", "quoter": "תומר", "quoted": "רון", "text": "בוא נפתח פוט- קאסט", "id": 112}, {"date": "24.3.2025", "quoter": "תומר", "quoted": "רון", "text": "רסיסי חותים", "id": 113}, {"date": "24.3.2025", "quoter": "רון", "quoted": "שלומי", "text": "באיזה קומה אתה? <ההודעה נערכה>", "id": 114}, {"date": "22.3.2025", "quoter": "תומר", "quoted": "יניב", "text": "איזה פלחים", "id": 115}, {"date": "21.3.2025", "quoter": "תומר", "quoted": "שלומי", "text": "מה כבר נשאר לנו", "id": 116}, {"date": "20.3.2025", "quoter": "רם", "quoted": "רון", "text": "שלומי איזו התחלה טובה", "id": 117}, {"date": "18.3.2025", "quoter": "תומר", "quoted": "יניב", "text": "יכול להיות פה מלא סיכויים 😂😂", "id": 118}, {"date": "17.3.2025", "quoter": "תומר", "quoted": "רון", "text": "הפכתי מברבוז לעגור", "id": 119}, {"date": "17.3.2025", "quoter": "תומר", "quoted": "רון", "text": "זה כמו לעשות סקס עם בצק", "id": 120}, {"date": "13.3.2025", "quoter": "תומר", "quoted": "רון", "text": "מה יקבלו בשבילנו … שני פלשמורה", "id": 121}, {"date": "13.3.2025", "quoter": "רון", "quoted": "תומר", "text": "אני איש של שלג", "id": 122}, {"date": "11.3.2025", "quoter": "תומר", "quoted": "שגיא", "text": "כולם עושים דאטה בייס", "id": 123}, {"date": "11.3.2025", "quoter": "תומר", "quoted": "רון", "text": "תקשיב מה תעשה ,…. אין לי עצות טובות 🤣🤣🤣", "id": 124}, {"date": "11.3.2025", "quoter": "תומר", "quoted": "ניר", "text": "טינדרלך", "id": 125}, {"date": "7.3.2025", "quoter": "תומר", "quoted": "ניר", "text": "אתה בדיבורים של סיפורים", "id": 126}, {"date": "7.3.2025", "quoter": "תומר", "quoted": "רון", "text": "גם תפוקה שלילית היא תפוקה", "id": 127}, {"date": "3.3.2025", "quoter": "תומר", "quoted": "יניב", "text": "אין גלה בסקלה", "id": 128}, {"date": "3.3.2025", "quoter": "תומר", "quoted": "רון", "text": "הבנאדם עובד בקבביר", "id": 129}, {"date": "21.2.2025", "quoter": "תומר", "quoted": "גילי", "text": "חד פזי , תלת פזי , העיקר שיהיה משובח", "id": 130}, {"date": "20.2.2025", "quoter": "רון", "quoted": "תומר", "text": "תזרום ותמסמס", "id": 131}, {"date": "18.2.2025", "quoter": "תומר", "quoted": "שגיא", "text": "מה זהו", "id": 132}, {"date": "18.2.2025", "quoter": "תומר", "quoted": "יניב", "text": "החילוק הוא מהיר", "id": 133}, {"date": "17.2.2025", "quoter": "רון", "quoted": "רם", "text": "אל תיקשר אליהן", "id": 134}, {"date": "14.2.2025", "quoter": "רון", "quoted": "תומר", "text": "אדם לאדם פירנאה", "id": 135}, {"date": "13.2.2025", "quoter": "רון", "quoted": "תומר", "text": "יצאו כל מיני יצורי כלאיים", "id": 136}, {"date": "11.2.2025", "quoter": "תומר", "quoted": "רון", "text": "סולו מוחיטו", "id": 137}, {"date": "26.1.2025", "quoter": "תומר", "quoted": "בראדלי", "text": "אם יש מקום מאחורה … אם בכלל יש ״אחורה״", "id": 138}, {"date": "26.1.2025", "quoter": "תומר", "quoted": "רון", "text": "איתי עשית רב פס", "id": 139}, {"date": "24.1.2025", "quoter": "תומר", "quoted": "רון", "text": "למה יניב טוען ששפכתי עליו את הוויסקי", "id": 140}, {"date": "24.1.2025", "quoter": "תומר", "quoted": "רון", "text": "יותר משהעגל רוצה לינוק … הפרה רוצה להינמק", "id": 141}, {"date": "21.1.2025", "quoter": "תומר", "quoted": "לירון", "text": "רגיל … חמש ,.. אבל סגור", "id": 142}, {"date": "21.1.2025", "quoter": "תומר", "quoted": "גילי", "text": "מילא ה6 … אבל יש לי את שגיא על הראש", "id": 143}, {"date": "10.1.2025", "quoter": "תומר", "quoted": "גילי", "text": "אני מרגיש פה מפספס משהו", "id": 144}, {"date": "7.1.2025", "quoter": "תומר", "quoted": "יניב", "text": "בדאלק כבי את הדוד", "id": 145}, {"date": "6.1.2025", "quoter": "רון", "quoted": "גילי", "text": "יש לך דייסון?", "id": 146}, {"date": "6.1.2025", "quoter": "תומר", "quoted": "יניב", "text": "( לרועי ) איזה עיני נץ יש לך … הייתי ממליץ לך ללכת למודיעין", "id": 147}, {"date": "3.1.2025", "quoter": "תומר", "quoted": "שלומי", "text": "ליצן רפואי בדנג׳ן", "id": 148}, {"date": "3.1.2025", "quoter": "תומר", "quoted": "רון", "text": "זה לפני הפפו גוגו", "id": 149}, {"date": "3.1.2025", "quoter": "תומר", "quoted": "רון", "text": "השבוע התחלתי לשחות", "id": 150}, {"date": "3.1.2025", "quoter": "תומר", "quoted": "ניר", "text": "( לאסי ) שלא ינחתו עליך שחפים", "id": 151}, {"date": "31.12.2024", "quoter": "תומר", "quoted": "רון", "text": "אתה משאיר טעם טוב של עוד 😂", "id": 152}, {"date": "31.12.2024", "quoter": "תומר", "quoted": "רון", "text": "עשית לו בדיקה ספירה", "id": 153}, {"date": "31.12.2024", "quoter": "תומר", "quoted": "יניב", "text": "כמו סטיק לכלב", "id": 154}, {"date": "31.12.2024", "quoter": "רון", "quoted": "תומר", "text": "בגובה פנס וחצי", "id": 155}, {"date": "31.12.2024", "quoter": "רון", "quoted": "תומר", "text": "אייל גולן אנס חמדאן", "id": 156}, {"date": "31.12.2024", "quoter": "תומר", "quoted": "רון", "text": "אתה חזק אתה … טקאצאנקו", "id": 157}, {"date": "30.12.2024", "quoter": "יניב", "quoted": "רון", "text": "מצאת לך זמן להביא את שושנת הרוחות", "id": 158}, {"date": "30.12.2024", "quoter": "יניב", "quoted": "תומר", "text": "בכל תפוז אתה מוצא את הטוב", "id": 159}, {"date": "27.12.2024", "quoter": "רון", "quoted": "יניב", "text": "וויל סמיט משחק את הכושי", "id": 160}, {"date": "26.12.2024", "quoter": "תומר", "quoted": "רון", "text": "כבר בחרנו פורטר", "id": 161}, {"date": "20.12.2024", "quoter": "שראל", "quoted": "רון", "text": "כשהקלפים מתחזקים שוקעים הכבשים", "id": 162}, {"date": "17.12.2024", "quoter": "תומר", "quoted": "ניר", "text": "הנה זה הגיע למכס", "id": 163}, {"date": "17.12.2024", "quoter": "תומר", "quoted": "לירון", "text": "אני נוהג", "id": 164}, {"date": "17.12.2024", "quoter": "תומר", "quoted": "ניר", "text": "זה כאילו קריסמס אצל רונן", "id": 165}, {"date": "17.12.2024", "quoter": "תומר", "quoted": "יניב", "text": "התכוונתי להיות בזהירות", "id": 166}, {"date": "17.12.2024", "quoter": "תומר", "quoted": "רון", "text": "אתה כל עולמך זה ג׳ירפות", "id": 167}, {"date": "13.12.2024", "quoter": "אלון", "quoted": "רון", "text": "כיף לדבר איתך מידי פעם", "id": 168}, {"date": "12.12.2024", "quoter": "אלון", "quoted": "תומר", "text": "יגלגל לי את המגולגל", "id": 169}, {"date": "10.12.2024", "quoter": "תומר", "quoted": "רון", "text": "אם מרטיבים לך תגיד תודה", "id": 170}, {"date": "10.12.2024", "quoter": "תומר", "quoted": "יניב", "text": "אתה אשכרה אמרת את זה …..🤦🏼‍♂️", "id": 171}, {"date": "9.12.2024", "quoter": "תומר", "quoted": "יניב", "text": "הסף ריגוש שלך זה מאה", "id": 172}, {"date": "6.12.2024", "quoter": "תומר", "quoted": "ניר", "text": "אני רשום שם כמו שינדלר", "id": 173}, {"date": "6.12.2024", "quoter": "רון", "quoted": "תומר", "text": "אמבפה ויד בלב", "id": 174}, {"date": "6.12.2024", "quoter": "רון", "quoted": "תומר", "text": "אל תבטח בג'דיי", "id": 175}, {"date": "6.12.2024", "quoter": "תומר", "quoted": "ניר", "text": "זה כמו ערבה בוכיה", "id": 176}, {"date": "6.12.2024", "quoter": "תומר", "quoted": "רון", "text": "זכית ב הפקר", "id": 177}, {"date": "6.12.2024", "quoter": "תומר", "quoted": "ניר", "text": "ברדלי … אתה בן אנוש", "id": 178}, {"date": "5.12.2024", "quoter": "תומר", "quoted": "גילי", "text": "אני צריך לבדוק שיש לי צד ג", "id": 179}, {"date": "3.12.2024", "quoter": "תומר", "quoted": "ניר", "text": "אתה כולך ספגטי בראש <ההודעה נערכה>", "id": 180}, {"date": "3.12.2024", "quoter": "תומר", "quoted": "רון", "text": "שים על ניוטרל ותזרום", "id": 181}, {"date": "3.12.2024", "quoter": "תומר", "quoted": "רון", "text": "רון ; וזה טיפ מאחד שמבין", "id": 182}, {"date": "28.11.2024", "quoter": "שראל", "quoted": "רון", "text": "ארנצ'יני בלי צ'יני", "id": 183}, {"date": "25.11.2024", "quoter": "תומר", "quoted": "ניר", "text": "זה כמו ה אקג של שלומי", "id": 184}, {"date": "21.11.2024", "quoter": "תומר", "quoted": "רון", "text": "אתה ממש עדי גורדון של הפוקר", "id": 185}, {"date": "18.11.2024", "quoter": "יניב", "quoted": "תומר", "text": "הקאפלה האסיסטנטית", "id": 186}, {"date": "18.11.2024", "quoter": "תומר", "quoted": "יניב", "text": "הוא לא עובר בטון", "id": 187}, {"date": "15.11.2024", "quoter": "אלון", "quoted": "תומר", "text": "פאפי גינת", "id": 188}, {"date": "15.11.2024", "quoter": "תומר", "quoted": "רון", "text": "היא אומרת לך דברים של אהבה … או משימות", "id": 189}, {"date": "14.11.2024", "quoter": "תומר", "quoted": "רון", "text": "יש בירות לרוב", "id": 190}, {"date": "14.11.2024", "quoter": "תומר", "quoted": "ניר", "text": "תחזיר את השד לג׳יני", "id": 191}, {"date": "14.11.2024", "quoter": "תומר", "quoted": "ניר", "text": "ההפסד זה החלק הפחות כואב 🤣", "id": 192}, {"date": "14.11.2024", "quoter": "תומר", "quoted": "רון", "text": "הבל היופי", "id": 193}, {"date": "8.11.2024", "quoter": "תומר", "quoted": "רון", "text": "משטרללת", "id": 194}, {"date": "8.11.2024", "quoter": "בראדלי", "quoted": "תומר", "text": "מי שמפנק מפנק", "id": 195}, {"date": "8.11.2024", "quoter": "רון", "quoted": "תומר", "text": "בית עלמין תנכי", "id": 196}, {"date": "8.11.2024", "quoter": "רון", "quoted": "ניר", "text": "מוות בקיבוץ", "id": 197}, {"date": "8.11.2024", "quoter": "תומר", "quoted": "רון", "text": "הכל פה מסוטט כמו בגן יפני", "id": 198}, {"date": "8.11.2024", "quoter": "תומר", "quoted": "רון", "text": "השחורה יותר … פחות", "id": 199}, {"date": "7.11.2024", "quoter": "רון", "quoted": "תומר", "text": "מי שעשה אישה מאושרת הציל אדם ועולמו", "id": 200}, {"date": "7.11.2024", "quoter": "תומר", "quoted": "רון", "text": "איילון טראמפ", "id": 201}, {"date": "4.11.2024", "quoter": "תומר", "quoted": "רון", "text": "אתה עושה לעצמך", "id": 202}, {"date": "4.11.2024", "quoter": "תומר", "quoted": "שגיא", "text": "זה לקרר את עצמך", "id": 203}, {"date": "31.10.2024", "quoter": "תומר", "quoted": "דניאל", "text": "איזה הנחה היה לך בקולומביה", "id": 204}, {"date": "29.10.2024", "quoter": "תומר", "quoted": "רון", "text": "אתה רוצה להזכיר לי נשכחות עבר <ההודעה נערכה>", "id": 205}, {"date": "29.10.2024", "quoter": "רם", "quoted": "רון", "text": "איזה ילד קסום אתה", "id": 206}, {"date": "29.10.2024", "quoter": "תומר", "quoted": "רון", "text": "עדיף ככה מאשר אחרת", "id": 207}, {"date": "28.10.2024", "quoter": "תומר", "quoted": "יניב", "text": "רון … תבוא איתך עם כוס של קולה", "id": 208}, {"date": "25.10.2024", "quoter": "תומר", "quoted": "יניב", "text": "תשדל זה האשמה", "id": 209}, {"date": "23.10.2024", "quoter": "תומר", "quoted": "רון", "text": "מכונאות שלג", "id": 210}, {"date": "23.10.2024", "quoter": "רון", "quoted": "תומר", "text": "כל הדסלש\"ים האלה", "id": 211}, {"date": "21.10.2024", "quoter": "תומר", "quoted": "ניר", "text": "אני רואה אותכם שוכבים ככה .. אני פוחד שהמחשבות שלכם יתחברו", "id": 212}, {"date": "18.10.2024", "quoter": "תומר", "quoted": "יניב", "text": "שם נטליקס ונרדם", "id": 213}, {"date": "18.10.2024", "quoter": "תומר", "quoted": "יניב", "text": "זה כמו המילטון יוצא לפיט", "id": 214}, {"date": "17.10.2024", "quoter": "תומר", "quoted": "רון", "text": "עליה וקוץ בה", "id": 215}, {"date": "11.10.2024", "quoter": "תומר", "quoted": "רון", "text": "עלית היהודים", "id": 216}, {"date": "10.10.2024", "quoter": "תומר", "quoted": "יניב", "text": "פסח … אני שומר מצות 🤦🏼‍♂️🤣", "id": 217}, {"date": "10.10.2024", "quoter": "תומר", "quoted": "רון", "text": "איזה רוגטקה", "id": 218}, {"date": "1.10.2024", "quoter": "יניב", "quoted": "שלומי", "text": "אני הלכתי לפול", "id": 219}, {"date": "30.9.2024", "quoter": "תומר", "quoted": "יניב", "text": "אני מרגיש תוכי 🦜", "id": 220}, {"date": "19.9.2024", "quoter": "תומר", "quoted": "רון", "text": "במבה פוטין", "id": 221}, {"date": "16.9.2024", "quoter": "יניב", "quoted": "רועי", "text": "ידעתי שאני עם האס", "id": 222}, {"date": "16.9.2024", "quoter": "אלון", "quoted": "תומר", "text": "אתה היית סאחי שומר מסך", "id": 223}, {"date": "2.9.2024", "quoter": "תומר", "quoted": "רון", "text": "אנשים באו פה פתוחי כיס", "id": 224}, {"date": "2.9.2024", "quoter": "תומר", "quoted": "יניב", "text": "הוא הגיע לסוף של הנטפליקס", "id": 225}, {"date": "30.8.2024", "quoter": "תומר", "quoted": "בראדלי", "text": "אבל תראה איזה ביטחון יש לו במפית", "id": 226}, {"date": "30.8.2024", "quoter": "אלון", "quoted": "בראדלי", "text": "סלאם הלייקרס", "id": 227}, {"date": "29.8.2024", "quoter": "תומר", "quoted": "רון", "text": "יש לי מדריכה חדשה … היא תמיד היתה 😂😂😂", "id": 228}, {"date": "25.8.2024", "quoter": "תומר", "quoted": "יניב", "text": "לאן עוד יכול עוד להתקדם נסראללה … הכי בכיר", "id": 229}, {"date": "25.8.2024", "quoter": "תומר", "quoted": "יניב", "text": "עכשיו זה חופש 😂", "id": 230}, {"date": "25.8.2024", "quoter": "תומר", "quoted": "יניב", "text": "כל אחד שידאג לעצמו", "id": 231}, {"date": "25.8.2024", "quoter": "תומר", "quoted": "יניב", "text": "אני מתהפך כמו שקדי מרק 😂😂", "id": 232}, {"date": "23.8.2024", "quoter": "תומר", "quoted": "רם", "text": "השמחה מהולה בשמחה", "id": 233}, {"date": "23.8.2024", "quoter": "רם", "quoted": "שלומי", "text": "לוקח גם את המטען נייד (לשירותים)", "id": 234}, {"date": "22.8.2024", "quoter": "רון", "quoted": "תומר", "text": "זונדה לפנים", "id": 235}, {"date": "20.8.2024", "quoter": "תומר", "quoted": "שלומי", "text": "סוג של אנה אהרונוב", "id": 236}, {"date": "20.8.2024", "quoter": "תומר", "quoted": "יניב", "text": "היא בת 100 … היא לא תזכור את זה", "id": 237}, {"date": "20.8.2024", "quoter": "תומר", "quoted": "רון", "text": "זה יכול להוביל לפריצת וריד", "id": 238}, {"date": "20.8.2024", "quoter": "תומר", "quoted": "רון", "text": "אני לא באופי הזה", "id": 239}, {"date": "19.8.2024", "quoter": "תומר", "quoted": "רון", "text": "היה לי שנה שחומה", "id": 240}, {"date": "19.8.2024", "quoter": "יניב", "quoted": "רון", "text": "הבן אדם במיטבו לא ילד", "id": 241}, {"date": "19.8.2024", "quoter": "רון", "quoted": "תומר", "text": "קלצרית", "id": 242}, {"date": "9.8.2024", "quoter": "רון", "quoted": "תומר", "text": "תפוקה שולית מתגברת", "id": 243}, {"date": "9.8.2024", "quoter": "תומר", "quoted": "רון", "text": "זה נחש עארס", "id": 244}, {"date": "8.8.2024", "quoter": "רם", "quoted": "תומר", "text": "שגיא אומר לך הילה שלך", "id": 245}, {"date": "8.8.2024", "quoter": "רם", "quoted": "רון", "text": "גילי התחלת להתפתח", "id": 246}, {"date": "6.8.2024", "quoter": "תומר", "quoted": "יניב", "text": "תיהיה hard to get , תענה לה אחרי סיבוב", "id": 247}, {"date": "5.8.2024", "quoter": "תומר", "quoted": "רון", "text": "יכול להיות שאתה עובר עכשיו חוויה אקס טריטוריאלית", "id": 248}, {"date": "5.8.2024", "quoter": "תומר", "quoted": "רון", "text": "אני מרגיש איש איש לנפשו", "id": 249}, {"date": "5.8.2024", "quoter": "יניב", "quoted": "תומר", "text": "עושק מורשה", "id": 250}, {"date": "5.8.2024", "quoter": "תומר", "quoted": "יניב", "text": "לרון יש ביצים של ברבור", "id": 251}, {"date": "5.8.2024", "quoter": "רם", "quoted": "תומר", "text": "גרביטציה של רוח..", "id": 252}, {"date": "2.8.2024", "quoter": "תומר", "quoted": "יניב", "text": "ברדלי …. שתבורך", "id": 253}, {"date": "2.8.2024", "quoter": "תומר", "quoted": "רון", "text": "שקדים מובחרים <ההודעה נערכה>", "id": 254}, {"date": "2.8.2024", "quoter": "תומר", "quoted": "יניב", "text": "תוודא שיש ברז", "id": 255}, {"date": "2.8.2024", "quoter": "תומר", "quoted": "יניב", "text": "תגידי ביתי", "id": 256}, {"date": "2.8.2024", "quoter": "תומר", "quoted": "יניב", "text": "אפשר להטביל פה את ישו", "id": 257}, {"date": "2.8.2024", "quoter": "תומר", "quoted": "יניב", "text": "כל המכס יושב פה", "id": 258}, {"date": "1.8.2024", "quoter": "רון", "quoted": "תומר", "text": "אני פה נוהג כמו נינגר", "id": 259}, {"date": "1.8.2024", "quoter": "תומר", "quoted": "יניב", "text": "הר אדם ובוכה", "id": 260}, {"date": "1.8.2024", "quoter": "תומר", "quoted": "יניב", "text": "דפקה להיא גלגלת", "id": 261}, {"date": "1.8.2024", "quoter": "תומר", "quoted": "יניב", "text": "מה זה פה שנות ה 80", "id": 262}, {"date": "29.7.2024", "quoter": "תומר", "quoted": "רון", "text": "מה באת פה כאילו פה מלון היייט", "id": 263}, {"date": "29.7.2024", "quoter": "תומר", "quoted": "רועי", "text": "קטע ….", "id": 264}, {"date": "12.7.2024", "quoter": "תומר", "quoted": "רון", "text": "אני חושב שפרשתי מהסקי … אני מעבר לשיא שלי 🤦🏼‍♂️😂", "id": 265}, {"date": "9.7.2024", "quoter": "תומר", "quoted": "רון", "text": "יש עוד סמנכ״ל מכירות זולתך ?", "id": 266}, {"date": "9.7.2024", "quoter": "תומר", "quoted": "ניר", "text": "זה מרשם אוכלוסין פה", "id": 267}, {"date": "4.7.2024", "quoter": "תומר", "quoted": "רון", "text": "שיראה איפה הוא משמפה", "id": 268}, {"date": "2.7.2024", "quoter": "אלון", "quoted": "תומר", "text": "אם הם היו עוברים שלב או לפחות שני שלבים", "id": 269}, {"date": "24.6.2024", "quoter": "תומר", "quoted": "ניר", "text": "בוא נעשה א .. ב … סטופ", "id": 270}, {"date": "24.6.2024", "quoter": "תומר", "quoted": "ניר", "text": "נבחרת צרפת יותר לבנה מזה", "id": 271}, {"date": "18.6.2024", "quoter": "תומר", "quoted": "רון", "text": "ניר אני אוהב אותך כשאתה מסכם אנשים", "id": 272}, {"date": "17.6.2024", "quoter": "תומר", "quoted": "ניר", "text": "( על רון ) זה המאיץ החלקיקים של תל מונד", "id": 273}, {"date": "17.6.2024", "quoter": "תומר", "quoted": "ניר", "text": "חברה … חברה , בוא ניהיה צנועים", "id": 274}, {"date": "17.6.2024", "quoter": "תומר", "quoted": "ניר", "text": "זה הפקק של הבירה", "id": 275}, {"date": "17.6.2024", "quoter": "תומר", "quoted": "רון", "text": "החברה של גדרה לא הוכיחו יכולות יתר", "id": 276}, {"date": "17.6.2024", "quoter": "רם", "quoted": "רון", "text": "מגה בייט <ההודעה נערכה>", "id": 277}, {"date": "17.6.2024", "quoter": "רם", "quoted": "תומר", "text": "..פתוח", "id": 278}, {"date": "13.6.2024", "quoter": "רון", "quoted": "תומר", "text": "מעלים אותו לעורלה", "id": 279}, {"date": "13.6.2024", "quoter": "תומר", "quoted": "רון", "text": "אין פה עם מי לדבר במיסיסיפי הזה", "id": 280}, {"date": "11.6.2024", "quoter": "תומר", "quoted": "יניב", "text": "איך יש מיידבראן באלסקה … מה ישרפו את האיגלואים", "id": 281}, {"date": "11.6.2024", "quoter": "תומר", "quoted": "רון", "text": "כל זוג נושא מזכרת", "id": 282}, {"date": "6.6.2024", "quoter": "תומר", "quoted": "רון", "text": "צריך לבזלן את ה פיתיל", "id": 283}, {"date": "5.6.2024", "quoter": "תומר", "quoted": "ניר", "text": "שום דבר טוב לא מחכה לך למעלה", "id": 284}, {"date": "4.6.2024", "quoter": "רם", "quoted": "תומר", "text": "ברמת שתיקה אתה בונקר", "id": 285}, {"date": "3.6.2024", "quoter": "תומר", "quoted": "יניב", "text": "דופק .. לא דופק … תעודת זהות כחולה", "id": 286}, {"date": "1.6.2024", "quoter": "אלון", "quoted": "יניב", "text": "הוא נגע בו במלוא היקפו", "id": 287}, {"date": "31.5.2024", "quoter": "תומר", "quoted": "יניב", "text": "כוס-אמק יום הולדת", "id": 288}, {"date": "30.5.2024", "quoter": "תומר", "quoted": "יניב", "text": "נשמה של ברבוניה 😂 🐟", "id": 289}, {"date": "21.5.2024", "quoter": "תומר", "quoted": "יניב", "text": "יש איזה ילד בבית", "id": 290}, {"date": "21.5.2024", "quoter": "תומר", "quoted": "רון", "text": "כחוט השני …..😳", "id": 291}, {"date": "21.5.2024", "quoter": "תומר", "quoted": "יניב", "text": "או שהעיניים שלי לא טובים .. או שהקלפים מטושטשים", "id": 292}, {"date": "21.5.2024", "quoter": "יניב", "quoted": "תומר", "text": "עושים פה פסים", "id": 293}, {"date": "21.5.2024", "quoter": "אלון", "quoted": "יניב", "text": "כמעט 2-5 גם", "id": 294}, {"date": "21.5.2024", "quoter": "יניב", "quoted": "תומר", "text": "גמילת אקדחים <ההודעה נערכה>", "id": 295}, {"date": "21.5.2024", "quoter": "רון", "quoted": "יניב", "text": "כמו בתולה זה לא נסגר", "id": 296}, {"date": "20.5.2024", "quoter": "אלון", "quoted": "רם", "text": "מה? זה הכל פאולים?", "id": 297}, {"date": "20.5.2024", "quoter": "אלון", "quoted": "יניב", "text": "ישבו בכטב״מ למעלה", "id": 298}, {"date": "17.5.2024", "quoter": "תומר", "quoted": "רון", "text": "אתה שוכח שיש אחרייך את קוני למל", "id": 299}, {"date": "17.5.2024", "quoter": "תומר", "quoted": "שלומי", "text": "אני עושה מהלך הומניטרי", "id": 300}, {"date": "16.5.2024", "quoter": "תומר", "quoted": "רון", "text": "כל הצרפתים הם ארגנטינאים", "id": 301}, {"date": "16.5.2024", "quoter": "תומר", "quoted": "רון", "text": "אני לא מדבר איתו באורך היום יום", "id": 302}, {"date": "16.5.2024", "quoter": "תומר", "quoted": "רון", "text": "עושה שולחנות … יחייה", "id": 303}, {"date": "10.5.2024", "quoter": "תומר", "quoted": "רון", "text": "זה לא סילי פוסטרופדי", "id": 304}, {"date": "10.5.2024", "quoter": "אלון", "quoted": "תומר", "text": "דיאלוג מהוגינה", "id": 305}, {"date": "10.5.2024", "quoter": "תומר", "quoted": "רון", "text": "גביה .. והודיה", "id": 306}, {"date": "10.5.2024", "quoter": "תומר", "quoted": "רון", "text": "( לרם ) שרפת 2 קילו קלוריות", "id": 307}, {"date": "7.5.2024", "quoter": "תומר", "quoted": "רון", "text": "הרגשת תחושה", "id": 308}, {"date": "7.5.2024", "quoter": "תומר", "quoted": "רון", "text": "אוראגואנה ( שם של ארץ חדשה )", "id": 309}, {"date": "6.5.2024", "quoter": "תומר", "quoted": "יניב", "text": "אני הולך לקזינו משחק רק בשולחן של הומואים", "id": 310}, {"date": "3.5.2024", "quoter": "רון", "quoted": "רם", "text": "שיא ת'פה איפה שהזין שלך", "id": 311}, {"date": "24.4.2024", "quoter": "תומר", "quoted": "יניב", "text": "פרה פרה …. יווני יווני", "id": 312}, {"date": "21.4.2024", "quoter": "תומר", "quoted": "רון", "text": "עשיתי אולסי פרי ( בני גנץ )", "id": 313}, {"date": "20.4.2024", "quoter": "יניב", "quoted": "תומר", "text": "בת לחיילת", "id": 314}, {"date": "16.4.2024", "quoter": "תומר", "quoted": "יניב", "text": "זה צדי צרפתי הקלפים האלו", "id": 315}, {"date": "16.4.2024", "quoter": "תומר", "quoted": "יניב", "text": "אפשר לאונרדו …", "id": 316}, {"date": "16.4.2024", "quoter": "תומר", "quoted": "יניב", "text": "וואי וואי , תראה מה הכינו לך … צלחת מלאה בבצל", "id": 317}, {"date": "15.4.2024", "quoter": "תומר", "quoted": "יניב", "text": "הכלבים לא אוהבים ערבים … ולהפך", "id": 318}, {"date": "15.4.2024", "quoter": "תומר", "quoted": "יניב", "text": "אבל איך את התמצית של הערבי", "id": 319}, {"date": "12.4.2024", "quoter": "תומר", "quoted": "ניר", "text": "הוא היה דוד ביזנטי של ר״ג", "id": 320}, {"date": "12.4.2024", "quoter": "תומר", "quoted": "בראדלי", "text": "יש כל מיני … נשאר מפסח", "id": 321}, {"date": "12.4.2024", "quoter": "תומר", "quoted": "בראדלי", "text": "motion detector", "id": 322}, {"date": "11.4.2024", "quoter": "תומר", "quoted": "שראל", "text": "איך אתה רוצה את זה …. קטן .. גדול", "id": 323}, {"date": "2.4.2024", "quoter": "רון", "quoted": "שגיא", "text": "סורי שמוליק, אבל בכל זאת יום הולדת", "id": 324}, {"date": "28.3.2024", "quoter": "תומר", "quoted": "ניר", "text": "תשתה תה קומו-מיל", "id": 325}, {"date": "28.3.2024", "quoter": "תומר", "quoted": "בראדלי", "text": "אתה צריך יותר לפתוח דברים ( לרון )", "id": 326}, {"date": "12.3.2024", "quoter": "תומר", "quoted": "יניב", "text": "אין כלום … רחמנא ניצלן", "id": 327}, {"date": "12.3.2024", "quoter": "יניב", "quoted": "שגיא", "text": "הן מאותו הגזע", "id": 328}, {"date": "11.3.2024", "quoter": "תומר", "quoted": "רון", "text": "מבלשטקים", "id": 329}, {"date": "8.3.2024", "quoter": "אלון", "quoted": "רון", "text": "רציתי להקפיץ את עצמי", "id": 330}, {"date": "8.3.2024", "quoter": "תומר", "quoted": "ניר", "text": "איזה טווס ביצות", "id": 331}, {"date": "8.3.2024", "quoter": "אלון", "quoted": "רון", "text": "מה לא קלאסי בי?", "id": 332}, {"date": "7.3.2024", "quoter": "רם", "quoted": "תומר", "text": "האקפלה האסיסטנטית", "id": 333}, {"date": "7.3.2024", "quoter": "תומר", "quoted": "רון", "text": "שמתי אותך במיתוג", "id": 334}, {"date": "7.3.2024", "quoter": "תומר", "quoted": "רון", "text": "רוצה להיות אסקימוסי", "id": 335}, {"date": "1.3.2024", "quoter": "תומר", "quoted": "שראל", "text": "באת צמא היום", "id": 336}, {"date": "1.3.2024", "quoter": "תומר", "quoted": "ניר", "text": "( לרון ) אתה מאוד חמדן", "id": 337}, {"date": "1.3.2024", "quoter": "תומר", "quoted": "רון", "text": "המרומם לא מנחם", "id": 338}, {"date": "29.2.2024", "quoter": "תומר", "quoted": "רון", "text": "סבה .. בני", "id": 339}, {"date": "26.2.2024", "quoter": "יניב", "quoted": "תומר", "text": "איבדת משקל יתר", "id": 340}, {"date": "26.2.2024", "quoter": "יניב", "quoted": "רון", "text": "א ד ברבור", "id": 341}, {"date": "23.2.2024", "quoter": "תומר", "quoted": "רון", "text": "אני מרגיש כמו ערביה בג׳נין", "id": 342}, {"date": "23.2.2024", "quoter": "תומר", "quoted": "יניב", "text": "קווין מרקורי", "id": 343}, {"date": "22.2.2024", "quoter": "תומר", "quoted": "רון", "text": "ציצים ספורטיביים", "id": 344}, {"date": "21.2.2024", "quoter": "תומר", "quoted": "רון", "text": "פרדי גרובר", "id": 345}, {"date": "21.2.2024", "quoter": "יניב", "quoted": "רון", "text": "יכולה לעשות ויש עליון", "id": 346}, {"date": "21.2.2024", "quoter": "יניב", "quoted": "תומר", "text": "מאדאם גיימס 😂", "id": 347}, {"date": "21.2.2024", "quoter": "תומר", "quoted": "שראל", "text": "יש שכר בעמל", "id": 348}, {"date": "20.2.2024", "quoter": "תומר", "quoted": "יניב", "text": "יש כאלו משפריצות … עושה לך אמבטיה", "id": 349}, {"date": "20.2.2024", "quoter": "רון", "quoted": "תומר", "text": "מעיינות אושפלו", "id": 350}, {"date": "20.2.2024", "quoter": "תומר", "quoted": "רון", "text": "המרכז לליקוי קנסות", "id": 351}, {"date": "20.2.2024", "quoter": "תומר", "quoted": "יניב", "text": "סע לפיצה דה לאחווה", "id": 352}, {"date": "20.2.2024", "quoter": "תומר", "quoted": "יניב", "text": "פאפ לאק", "id": 353}, {"date": "20.2.2024", "quoter": "רם", "quoted": "יניב", "text": "סע לפיצה דה למוטה", "id": 354}, {"date": "15.2.2024", "quoter": "תומר", "quoted": "רון", "text": "הוא נשפן בתזמורת צה״ל", "id": 355}, {"date": "15.2.2024", "quoter": "תומר", "quoted": "רון", "text": "רואים שאתה gto", "id": 356}, {"date": "15.2.2024", "quoter": "תומר", "quoted": "ניר", "text": "אפילו הפלישתים לא רוצים למות איתך", "id": 357}, {"date": "13.2.2024", "quoter": "יניב", "quoted": "רון", "text": "בלגן חינני", "id": 358}, {"date": "5.2.2024", "quoter": "תומר", "quoted": "ניר", "text": "אתה חייב לקרוא את הפרק על אומההה", "id": 359}, {"date": "2.2.2024", "quoter": "תומר", "quoted": "רון", "text": "אתם באים לעשות עלי מתמטיקה", "id": 360}, {"date": "30.1.2024", "quoter": "תומר", "quoted": "רון", "text": "האמא היתה  עסיסית חצי גמורה", "id": 361}, {"date": "30.1.2024", "quoter": "תומר", "quoted": "יניב", "text": "בוא אני אראה לך מה אני מצלם", "id": 362}, {"date": "30.1.2024", "quoter": "תומר", "quoted": "ניר", "text": "איתי אנגל התפטר", "id": 363}, {"date": "30.1.2024", "quoter": "אלון", "quoted": "שגיא", "text": "מה זה ניסים?", "id": 364}, {"date": "30.1.2024", "quoter": "אלון", "quoted": "ניר", "text": "מה אתה ביולוג?", "id": 365}, {"date": "29.1.2024", "quoter": "תומר", "quoted": "רון", "text": "אצל יניב יש או לפני זיון או אחרי זיון", "id": 366}, {"date": "29.1.2024", "quoter": "אלון", "quoted": "יניב", "text": "בירה האופנה", "id": 367}, {"date": "29.1.2024", "quoter": "תומר", "quoted": "רון", "text": "אין לי עט", "id": 368}, {"date": "8.1.2024", "quoter": "תומר", "quoted": "רון", "text": "אתה תיהיה שדוד", "id": 369}, {"date": "31.12.2023", "quoter": "תומר", "quoted": "רון", "text": "משתדל להיות צמוד לקרקע", "id": 370}, {"date": "31.12.2023", "quoter": "תומר", "quoted": "רון", "text": "זה בא אליך בחפוטות", "id": 371}, {"date": "31.12.2023", "quoter": "רון", "quoted": "תומר", "text": "אני מחר יכול להיות בתוך קלמנטינה ואני לא אשים לב", "id": 372}, {"date": "30.12.2023", "quoter": "יניב", "quoted": "תומר", "text": "מה מה ?", "id": 373}, {"date": "29.12.2023", "quoter": "תומר", "quoted": "רון", "text": "חפ״ש , רס״ק", "id": 374}, {"date": "29.12.2023", "quoter": "תומר", "quoted": "רון", "text": "אירוח אצלך זה שנ-זליזה", "id": 375}, {"date": "28.12.2023", "quoter": "תומר", "quoted": "רון", "text": "אני אוטוטו מתחיל לשחות … בחלל החיצוני", "id": 376}, {"date": "25.12.2023", "quoter": "תומר", "quoted": "יניב", "text": "אני מרגיש כמו בלימונצאלו", "id": 377}, {"date": "25.12.2023", "quoter": "תומר", "quoted": "רון", "text": "כזה חיבור בין קלפים לאדם", "id": 378}, {"date": "22.12.2023", "quoter": "יניב", "quoted": "תומר", "text": "כל אחד סורי סורי על התחת שלי", "id": 379}, {"date": "22.12.2023", "quoter": "תומר", "quoted": "יניב", "text": "יאללה באת צאטר", "id": 380}, {"date": "22.12.2023", "quoter": "תומר", "quoted": "רון", "text": "אחד נהנה … אחד לא חסר", "id": 381}, {"date": "22.12.2023", "quoter": "רון", "quoted": "ניר", "text": "אנחנו כמו דגי אווז", "id": 382}, {"date": "21.12.2023", "quoter": "תומר", "quoted": "ניר", "text": "אין לי נספרציות", "id": 383}, {"date": "20.12.2023", "quoter": "תומר", "quoted": "שגיא", "text": "קיבלתי שבת על הפין", "id": 384}, {"date": "20.12.2023", "quoter": "תומר", "quoted": "רון", "text": "( תומר ) פגש אותי פגש", "id": 385}, {"date": "20.12.2023", "quoter": "תומר", "quoted": "רון", "text": "זה בננית", "id": 386}, {"date": "20.12.2023", "quoter": "תומר", "quoted": "רון", "text": "ואז נפתח לי הגישה לצבע", "id": 387}, {"date": "15.12.2023", "quoter": "אלון", "quoted": "רון", "text": "מה הבאת פה? את הרדיו של המלחמה?", "id": 388}, {"date": "14.12.2023", "quoter": "אלון", "quoted": "רון", "text": "יהיה כיף כליפה <ההודעה נערכה>", "id": 389}, {"date": "12.12.2023", "quoter": "תומר", "quoted": "בראדלי", "text": "עזוב את השיר … תראה את התחת שלה", "id": 390}, {"date": "11.12.2023", "quoter": "יניב", "quoted": "תומר", "text": "יועצסקי", "id": 391}, {"date": "11.12.2023", "quoter": "תומר", "quoted": "יניב", "text": "מס הכנסה", "id": 392}, {"date": "8.12.2023", "quoter": "רון", "quoted": "תומר", "text": "שואב בארות יחיה", "id": 393}, {"date": "8.12.2023", "quoter": "רון", "quoted": "תומר", "text": "משחק לך עם הגולגולת", "id": 394}, {"date": "8.12.2023", "quoter": "תומר", "quoted": "בראדלי", "text": "אני לא חושב … איי לא יודע … אני לא מצאתי", "id": 395}, {"date": "8.12.2023", "quoter": "רון", "quoted": "בראדלי", "text": "המיול הוא שקרן", "id": 396}, {"date": "7.12.2023", "quoter": "תומר", "quoted": "רון", "text": "זה לא משנה … בשניהם היית חזק בראש שלך", "id": 397}, {"date": "7.12.2023", "quoter": "תומר", "quoted": "רון", "text": "כמה זמן אתה כותב , נהיית לי טולסטוי", "id": 398}, {"date": "7.12.2023", "quoter": "תומר", "quoted": "רון", "text": "תעשה זעקת החמור", "id": 399}, {"date": "7.12.2023", "quoter": "רון", "quoted": "תומר", "text": "שמתי סוריקטה", "id": 400}, {"date": "4.12.2023", "quoter": "תומר", "quoted": "יניב", "text": "מה שבא הולך 😆", "id": 401}, {"date": "24.11.2023", "quoter": "תומר", "quoted": "יניב", "text": "( על רון ) הוא טכנופוב", "id": 402}, {"date": "24.11.2023", "quoter": "רון", "quoted": "יניב", "text": "כל היום אני גולל 😂", "id": 403}, {"date": "21.11.2023", "quoter": "רון", "quoted": "תומר", "text": "רוסי בפועל", "id": 404}, {"date": "21.11.2023", "quoter": "יניב", "quoted": "רון", "text": "הרשקו תיכנס", "id": 405}, {"date": "16.11.2023", "quoter": "תומר", "quoted": "רון", "text": "( לרם ) תעצור רגע עם אירנה", "id": 406}, {"date": "13.11.2023", "quoter": "תומר", "quoted": "רון", "text": "עלה מולי", "id": 407}, {"date": "13.11.2023", "quoter": "תומר", "quoted": "יניב", "text": "זיבי , צריך להראות פול", "id": 408}, {"date": "7.11.2023", "quoter": "תומר", "quoted": "יניב", "text": "הולך מחר קונה בוקסות", "id": 409}, {"date": "6.11.2023", "quoter": "תומר", "quoted": "יניב", "text": "מה חזק … בננה לוטי עם הרבה מייפל", "id": 410}, {"date": "6.11.2023", "quoter": "תומר", "quoted": "יניב", "text": "( לרון ) אתה צריך להיות ניוטון", "id": 411}, {"date": "3.11.2023", "quoter": "תומר", "quoted": "בראדלי", "text": "מי שמגלגל לא יכול לקחת 7:2", "id": 412}, {"date": "27.10.2023", "quoter": "תומר", "quoted": "רון", "text": "ברבור ללא תכלית", "id": 413}, {"date": "24.10.2023", "quoter": "תומר", "quoted": "רם", "text": "יותר חלש מנמלה בחורף", "id": 414}, {"date": "12.10.2023", "quoter": "בראדלי", "quoted": "רון", "text": "שהוא ישן, הוא ישן.", "id": 415}, {"date": "6.10.2023", "quoter": "תומר", "quoted": "רון", "text": "אם אתה בחתונה הלבנה תביא לי שווארמה", "id": 416}, {"date": "5.10.2023", "quoter": "אלון", "quoted": "רון", "text": "וזה עובד?", "id": 417}, {"date": "20.9.2023", "quoter": "תומר", "quoted": "דניאל", "text": "אתה יודע מה זה קווה לרוסי", "id": 418}, {"date": "20.9.2023", "quoter": "תומר", "quoted": "רון", "text": "( על רם ) הוא הפסקול של הערב", "id": 419}, {"date": "20.9.2023", "quoter": "תומר", "quoted": "ניר", "text": "ממש נטפליקס", "id": 420}, {"date": "20.9.2023", "quoter": "תומר", "quoted": "יניב", "text": "היו פה לימונים הם היו אוכלים את זה", "id": 421}, {"date": "20.9.2023", "quoter": "תומר", "quoted": "ניר", "text": "אתה הרקטום של השטן", "id": 422}, {"date": "19.9.2023", "quoter": "תומר", "quoted": "יניב", "text": "אנטי באבא", "id": 423}, {"date": "19.9.2023", "quoter": "תומר", "quoted": "ניר", "text": "יצאת אבו מאזן", "id": 424}, {"date": "19.9.2023", "quoter": "תומר", "quoted": "ניר", "text": "אהבתי יותר את רם שהוא שותק", "id": 425}, {"date": "8.9.2023", "quoter": "רון", "quoted": "שראל", "text": "מה זה אין לי כלום????", "id": 426}, {"date": "8.9.2023", "quoter": "תומר", "quoted": "רון", "text": "עינך הרואות", "id": 427}, {"date": "7.9.2023", "quoter": "תומר", "quoted": "רם", "text": "הוא שם לה סם אונס … רק בלי אונס", "id": 428}, {"date": "7.9.2023", "quoter": "תומר", "quoted": "רון", "text": "ניקנוק של יום הולדת", "id": 429}, {"date": "7.9.2023", "quoter": "תומר", "quoted": "רון", "text": "אתה יכול להיות הארכיאולוג שלי", "id": 430}, {"date": "5.9.2023", "quoter": "תומר", "quoted": "רון", "text": "אחכ הם יחרבנו לך חריפים", "id": 431}, {"date": "5.9.2023", "quoter": "תומר", "quoted": "רון", "text": "אני איש של אופנה", "id": 432}, {"date": "1.9.2023", "quoter": "תומר", "quoted": "רון", "text": "הוא בנוי לתלפיות", "id": 433}, {"date": "28.8.2023", "quoter": "רון", "quoted": "תומר", "text": "למפרע-דז'וו", "id": 434}, {"date": "28.8.2023", "quoter": "תומר", "quoted": "ניר", "text": "תביא לו תביא … בעדינות", "id": 435}, {"date": "28.8.2023", "quoter": "תומר", "quoted": "רון", "text": "היא המלכה , המלך", "id": 436}, {"date": "21.8.2023", "quoter": "תומר", "quoted": "יניב", "text": "שב שב עם כל האיסופים האלו", "id": 437}, {"date": "18.8.2023", "quoter": "אלון", "quoted": "יניב", "text": "כשיש ציצים מי מסתכל על הלק ג׳ל?", "id": 438}, {"date": "18.8.2023", "quoter": "אלון", "quoted": "תומר", "text": "הדגדגן מהמלין", "id": 439}, {"date": "17.8.2023", "quoter": "אלון", "quoted": "ניר", "text": "שור בדיז׳ון", "id": 440}, {"date": "15.8.2023", "quoter": "אלון", "quoted": "יניב", "text": "הפכפוך הזה מעצבן אותי", "id": 441}, {"date": "15.8.2023", "quoter": "תומר", "quoted": "רון", "text": "כשאני מפחיד את שמוליק … אני מפחיד את שמוליק", "id": 442}, {"date": "15.8.2023", "quoter": "תומר", "quoted": "רון", "text": "איזה מטלטלים יש לך", "id": 443}, {"date": "15.8.2023", "quoter": "תומר", "quoted": "רון", "text": "אם אני הולך … אני הולך בגדול", "id": 444}, {"date": "8.8.2023", "quoter": "תומר", "quoted": "רם", "text": "זה ריח מתקתק", "id": 445}, {"date": "8.8.2023", "quoter": "תומר", "quoted": "ניר", "text": "תביא לו דובוני איכפת לי", "id": 446}, {"date": "8.8.2023", "quoter": "תומר", "quoted": "בראדלי", "text": "היא חמודה", "id": 447}, {"date": "1.8.2023", "quoter": "רון", "quoted": "תומר", "text": "חומר המזיה", "id": 448}, {"date": "1.8.2023", "quoter": "תומר", "quoted": "רון", "text": "עשית לי , מי שבירך", "id": 449}, {"date": "1.8.2023", "quoter": "תומר", "quoted": "רון", "text": "בנאדם יושב פה על קופה של שרצים", "id": 450}, {"date": "1.8.2023", "quoter": "תומר", "quoted": "יניב", "text": "כמו שאתה פה … היא", "id": 451}, {"date": "1.8.2023", "quoter": "תומר", "quoted": "רון", "text": "עד לפה עבר חצי יממה", "id": 452}, {"date": "31.7.2023", "quoter": "תומר", "quoted": "בראדלי", "text": "הכושי מהקונגו", "id": 453}, {"date": "30.7.2023", "quoter": "תומר", "quoted": "רון", "text": "ככה צריך לקחת את החיים , בעליזות", "id": 454}, {"date": "22.7.2023", "quoter": "רון", "quoted": "ניר", "text": "ביצת עין עלומה", "id": 455}, {"date": "21.7.2023", "quoter": "תומר", "quoted": "רון", "text": "אני כולי מגולגל בתוך עצמי", "id": 456}, {"date": "21.7.2023", "quoter": "תומר", "quoted": "יניב", "text": "אם ג’ין … אז צריך גם טוניק", "id": 457}, {"date": "21.7.2023", "quoter": "תומר", "quoted": "בראדלי", "text": "פאקינג נינג׳ה מאן", "id": 458}, {"date": "21.7.2023", "quoter": "תומר", "quoted": "בראדלי", "text": "לייק ליזרד", "id": 459}, {"date": "20.7.2023", "quoter": "תומר", "quoted": "שראל", "text": "זה טוב לנסטינג", "id": 460}, {"date": "14.7.2023", "quoter": "תומר", "quoted": "לירון", "text": "השופך מנקה", "id": 461}, {"date": "14.7.2023", "quoter": "תומר", "quoted": "רון", "text": "השני היה משחק מילים", "id": 462}, {"date": "14.7.2023", "quoter": "תומר", "quoted": "רון", "text": "אני , חיילות 0", "id": 463}, {"date": "14.7.2023", "quoter": "תומר", "quoted": "בראדלי", "text": "מי עושה את הקפה", "id": 464}, {"date": "11.7.2023", "quoter": "תומר", "quoted": "רון", "text": "צ׳איי לילד המפגר", "id": 465}, {"date": "10.7.2023", "quoter": "אלון", "quoted": "תומר", "text": "הנה סיכום ביניים לחמישי ..", "id": 466}, {"date": "8.7.2023", "quoter": "תומר", "quoted": "רון", "text": "אני כבר מבורדק", "id": 467}, {"date": "8.7.2023", "quoter": "תומר", "quoted": "רון", "text": "סכום סכום", "id": 468}, {"date": "8.7.2023", "quoter": "תומר", "quoted": "רון", "text": "אם אתה לא זורם … מזרימים אותך", "id": 469}, {"date": "8.7.2023", "quoter": "רון", "quoted": "תומר", "text": "באן בריאות (תמונה בהמשך)", "id": 470}, {"date": "7.7.2023", "quoter": "אלון", "quoted": "תומר", "text": "על חמש עשרה לא תיפול מדינה", "id": 471}, {"date": "6.7.2023", "quoter": "אלון", "quoted": "תומר", "text": "חסר פה רק נייק", "id": 472}, {"date": "4.7.2023", "quoter": "תומר", "quoted": "רון", "text": "משה לך ברח … משה לך ברח", "id": 473}, {"date": "3.7.2023", "quoter": "תומר", "quoted": "רון", "text": "מה שלא טעיתי … הולך לאלוהים", "id": 474}, {"date": "3.7.2023", "quoter": "רון", "quoted": "ניר", "text": "זוג אס זה דיקי טריקי", "id": 475}, {"date": "1.7.2023", "quoter": "רון", "quoted": "תומר", "text": "5 יחידות זנות", "id": 476}, {"date": "1.7.2023", "quoter": "רון", "quoted": "תומר", "text": "הומופוב מוצהר", "id": 477}, {"date": "29.6.2023", "quoter": "תומר", "quoted": "שראל", "text": "יצאתי מבולבל מכל הידיים", "id": 478}, {"date": "29.6.2023", "quoter": "תומר", "quoted": "ניר", "text": "יצאת מצולק", "id": 479}, {"date": "29.6.2023", "quoter": "תומר", "quoted": "רון", "text": "אם קוברים אותי עכשיו יוצא עץ של זית", "id": 480}, {"date": "27.6.2023", "quoter": "אלון", "quoted": "יניב", "text": "כמו שלימייזל הוא הולך", "id": 481}, {"date": "26.6.2023", "quoter": "אלון", "quoted": "רון", "text": "צמצום לב ריאה", "id": 482}, {"date": "23.6.2023", "quoter": "תומר", "quoted": "רון", "text": "המרפסת הלבנה", "id": 483}, {"date": "23.6.2023", "quoter": "אלון", "quoted": "תומר", "text": "איך קוראים לחיה הזו שדומה לסורילנקי?", "id": 484}, {"date": "23.6.2023", "quoter": "אלון", "quoted": "רון", "text": "הוא מסקר נשים מוכות", "id": 485}, {"date": "23.6.2023", "quoter": "אלון", "quoted": "תומר", "text": "ידיים עצובות לרווחה", "id": 486}, {"date": "23.6.2023", "quoter": "תומר", "quoted": "רון", "text": "פאפ קינוחים", "id": 487}, {"date": "23.6.2023", "quoter": "תומר", "quoted": "בראדלי", "text": "יאללללה קפה 🤣", "id": 488}, {"date": "23.6.2023", "quoter": "תומר", "quoted": "בראדלי", "text": "זה טוב לידיים", "id": 489}, {"date": "23.6.2023", "quoter": "רון", "quoted": "תומר", "text": "משורר סתם", "id": 490}, {"date": "23.6.2023", "quoter": "תומר", "quoted": "בראדלי", "text": "צוללת של הצבא … צוללת אבל למה ?", "id": 491}, {"date": "20.6.2023", "quoter": "רון", "quoted": "תומר", "text": "אני לא עושה פה חאפר מאפר", "id": 492}, {"date": "19.6.2023", "quoter": "יניב", "quoted": "רון", "text": "דגים בקארי", "id": 493}, {"date": "19.6.2023", "quoter": "תומר", "quoted": "רון", "text": "דפוק …", "id": 494}, {"date": "19.6.2023", "quoter": "יניב", "quoted": "תומר", "text": "הצהרון של רון", "id": 495}, {"date": "19.6.2023", "quoter": "תומר", "quoted": "יניב", "text": "אין לי עיניים 👀", "id": 496}, {"date": "19.6.2023", "quoter": "רון", "quoted": "בראדלי", "text": "הייתי קומביה בסיני <ההודעה נערכה>", "id": 497}, {"date": "19.6.2023", "quoter": "רון", "quoted": "תומר", "text": "לפרעון עולם", "id": 498}, {"date": "19.6.2023", "quoter": "תומר", "quoted": "יניב", "text": "היה נתון שלא ידעתי", "id": 499}, {"date": "16.6.2023", "quoter": "אלון", "quoted": "תומר", "text": "זה לא דבר אורבני", "id": 500}, {"date": "16.6.2023", "quoter": "תומר", "quoted": "שראל", "text": "איזה פריזנטים קנטה", "id": 501}, {"date": "16.6.2023", "quoter": "רון", "quoted": "ניר", "text": "ג'מבו נאמבר פייב", "id": 502}, {"date": "8.6.2023", "quoter": "תומר", "quoted": "לירון", "text": "( לרון ) אתה יפה לגילך", "id": 503}, {"date": "2.6.2023", "quoter": "תומר", "quoted": "רון", "text": "אתה קרוב לרש״בי", "id": 504}, {"date": "1.6.2023", "quoter": "תומר", "quoted": "רון", "text": "שייט  … ים", "id": 505}, {"date": "1.6.2023", "quoter": "רון", "quoted": "תומר", "text": "זה לא הודיה", "id": 506}, {"date": "1.6.2023", "quoter": "רון", "quoted": "ניר", "text": "בסאם קסאם", "id": 507}, {"date": "30.5.2023", "quoter": "תומר", "quoted": "יניב", "text": "יש לך עם זה חמור גז ?", "id": 508}, {"date": "30.5.2023", "quoter": "תומר", "quoted": "רון", "text": ",היא שכבה עם קשישים", "id": 509}, {"date": "30.5.2023", "quoter": "תומר", "quoted": "יניב", "text": "אין דלקה 😂😂", "id": 510}, {"date": "30.5.2023", "quoter": "תומר", "quoted": "רון", "text": "מחלק לחתולים", "id": 511}, {"date": "30.5.2023", "quoter": "תומר", "quoted": "רון", "text": "כל מה שמייצר  הוצאות … תיפטר", "id": 512}, {"date": "30.5.2023", "quoter": "תומר", "quoted": "רון", "text": "שלומי הוא הגבעתי , פלח״אן , פלמ״ח ….", "id": 513}, {"date": "29.5.2023", "quoter": "תומר", "quoted": "יניב", "text": "עקרבים פה כולם", "id": 514}, {"date": "29.5.2023", "quoter": "תומר", "quoted": "רון", "text": "יניב , אתה רגע לפני ספה", "id": 515}, {"date": "19.5.2023", "quoter": "רון", "quoted": "תומר", "text": "מה זה פה קזינו?", "id": 516}, {"date": "19.5.2023", "quoter": "אלון", "quoted": "שגיא", "text": "מגרד לי עלייך", "id": 517}, {"date": "16.5.2023", "quoter": "שלומי", "quoted": "רון", "text": "זה שף אחושפשף!!", "id": 518}, {"date": "15.5.2023", "quoter": "תומר", "quoted": "רון", "text": "כוכב חיובי , לא כוכב שלילי", "id": 519}, {"date": "15.5.2023", "quoter": "תומר", "quoted": "בראדלי", "text": "לכל אחד יש סיפור", "id": 520}, {"date": "15.5.2023", "quoter": "תומר", "quoted": "רון", "text": "אם הוא מחכה עוד 4-5 חודשים הוא היה מלכת אנגליה", "id": 521}, {"date": "15.5.2023", "quoter": "תומר", "quoted": "בראדלי", "text": "מה זה משנה בת כמה היא … הוא עוד שניה מת 🤦🏼‍♂️", "id": 522}, {"date": "15.5.2023", "quoter": "תומר", "quoted": "רון", "text": "ריברי ריבר-רם", "id": 523}, {"date": "12.5.2023", "quoter": "רם", "quoted": "רון", "text": "בוטיק בשרים טירה (יציאה מזרחית)!", "id": 524}, {"date": "12.5.2023", "quoter": "תומר", "quoted": "רם", "text": "איבוד כיוון מוזיקלי", "id": 525}, {"date": "12.5.2023", "quoter": "תומר", "quoted": "רון", "text": "יאנוש קורצ׳ק אתה", "id": 526}, {"date": "11.5.2023", "quoter": "תומר", "quoted": "רון", "text": "אז לא פגעת בו", "id": 527}, {"date": "7.5.2023", "quoter": "תומר", "quoted": "רון", "text": "בונדינג בין אדם למכונה", "id": 528}, {"date": "6.5.2023", "quoter": "תומר", "quoted": "רון", "text": "שחפל חשמל", "id": 529}, {"date": "6.5.2023", "quoter": "רון", "quoted": "תומר", "text": "דג בלי אידרה הוא לא דג", "id": 530}, {"date": "6.5.2023", "quoter": "תומר", "quoted": "שראל", "text": "אפשר להחזיר את האלכוהול בדיוטי ?", "id": 531}, {"date": "5.5.2023", "quoter": "תומר", "quoted": "רון", "text": "אני מבעבע", "id": 532}, {"date": "5.5.2023", "quoter": "תומר", "quoted": "רון", "text": "copy off של משהו", "id": 533}, {"date": "5.5.2023", "quoter": "תומר", "quoted": "רון", "text": "אתה כמו ניגר סיני", "id": 534}, {"date": "4.5.2023", "quoter": "תומר", "quoted": "רון", "text": "הבנאדם שוטר , כבד אותו", "id": 535}, {"date": "3.5.2023", "quoter": "רון", "quoted": "תומר", "text": "אני צריך להתפנות קצת לעבודה", "id": 536}, {"date": "3.5.2023", "quoter": "תומר", "quoted": "רון", "text": "וואי וויאי כמה קומות יש פה אצלך בבית", "id": 537}, {"date": "3.5.2023", "quoter": "תומר", "quoted": "רון", "text": "יש לי אינסטינקטים של פודל", "id": 538}, {"date": "3.5.2023", "quoter": "תומר", "quoted": "רון", "text": "האוטו פה מתייבש", "id": 539}, {"date": "2.5.2023", "quoter": "תומר", "quoted": "יניב", "text": "היה לי טלפון פעם", "id": 540}, {"date": "2.5.2023", "quoter": "תומר", "quoted": "יניב", "text": "עשיתי להם הקראה מודרכת", "id": 541}, {"date": "2.5.2023", "quoter": "תומר", "quoted": "רון", "text": "בא לי הופעה של דוד גפן", "id": 542}, {"date": "2.5.2023", "quoter": "תומר", "quoted": "יניב", "text": "נראה לי שאתה רוצה עלי גפן", "id": 543}, {"date": "1.5.2023", "quoter": "תומר", "quoted": "שראל", "text": "ברדלי , בוא דבר ואז דבר", "id": 544}, {"date": "1.5.2023", "quoter": "תומר", "quoted": "רון", "text": "לב מלא רחמים", "id": 545}, {"date": "28.4.2023", "quoter": "רון", "quoted": "יניב", "text": "מזכיר לי כמה פוזיציות.", "id": 546}, {"date": "28.4.2023", "quoter": "רם", "quoted": "יניב", "text": "יא טומטום", "id": 547}, {"date": "28.4.2023", "quoter": "תומר", "quoted": "רון", "text": "מיקרוסופט", "id": 548}, {"date": "28.4.2023", "quoter": "תומר", "quoted": "יניב", "text": "תעריף פרימיום", "id": 549}, {"date": "27.4.2023", "quoter": "רון", "quoted": "תומר", "text": "חלב של הוודקה", "id": 550}, {"date": "27.4.2023", "quoter": "רם", "quoted": "רון", "text": "בשארית כוחותיי", "id": 551}, {"date": "20.4.2023", "quoter": "תומר", "quoted": "רם", "text": "זה דליק ( על הטיל של מאסק )", "id": 552}, {"date": "19.4.2023", "quoter": "תומר", "quoted": "רון", "text": "זנות לאור יום", "id": 553}, {"date": "11.4.2023", "quoter": "תומר", "quoted": "יניב", "text": "( לברדלי ) באיזה גיל אתה עשית ברית ?? 🤣🤣", "id": 554}, {"date": "11.4.2023", "quoter": "יניב", "quoted": "בראדלי", "text": "עשיתי ברית לפני שהייתי ברדלי", "id": 555}, {"date": "10.4.2023", "quoter": "רון", "quoted": "תומר", "text": "האדם הקדמון של העתיד", "id": 556}, {"date": "10.4.2023", "quoter": "תומר", "quoted": "רון", "text": "תראה איך הוא חתוך ( על האבטיח ) הוא כמו סיניות", "id": 557}, {"date": "10.4.2023", "quoter": "תומר", "quoted": "רון", "text": "הייתי עם רדיקאלים חופשיים", "id": 558}, {"date": "7.4.2023", "quoter": "תומר", "quoted": "יניב", "text": "אני לא ישן בלילה מה שניר ישן ביום 😂😂", "id": 559}, {"date": "7.4.2023", "quoter": "תומר", "quoted": "יניב", "text": "זה עוזר לך … אתה עושה סקואטים", "id": 560}, {"date": "7.4.2023", "quoter": "תומר", "quoted": "ניר", "text": "פרצוף עצוב , גמדים נמוכים", "id": 561}, {"date": "7.4.2023", "quoter": "תומר", "quoted": "ניר", "text": "רציתי לשים את הסטימות שלי על זה", "id": 562}, {"date": "7.4.2023", "quoter": "תומר", "quoted": "יניב", "text": "( לרונן ) איזה מוגזם אתה", "id": 563}, {"date": "4.4.2023", "quoter": "תומר", "quoted": "שלומי", "text": "שיר אהבה בדואי", "id": 564}, {"date": "4.4.2023", "quoter": "רון", "quoted": "יניב", "text": "יונה וולך יבוא לך", "id": 565}, {"date": "4.4.2023", "quoter": "תומר", "quoted": "יניב", "text": "דאבל מוכטה … זה שם של שיר", "id": 566}, {"date": "4.4.2023", "quoter": "תומר", "quoted": "יניב", "text": "זה יכול להשתלט על עצמו", "id": 567}, {"date": "27.3.2023", "quoter": "תומר", "quoted": "ניר", "text": "כולכם יושבים כאלו אתם בחדר אוכל בקיבוץ דגניה ב", "id": 568}, {"date": "27.3.2023", "quoter": "תומר", "quoted": "שלומי", "text": "עוד שניה הולך לרדת פה גשם", "id": 569}, {"date": "26.3.2023", "quoter": "תומר", "quoted": "רון", "text": "יבואו ציוותי סיקור של מד״א", "id": 570}, {"date": "26.3.2023", "quoter": "תומר", "quoted": "רון", "text": "אני פה נסחב עם הפומית", "id": 571}, {"date": "23.3.2023", "quoter": "תומר", "quoted": "רון", "text": "בן של מלך", "id": 572}, {"date": "21.3.2023", "quoter": "תומר", "quoted": "רון", "text": "אני מרגיש כמו שימי  תבורי", "id": 573}, {"date": "21.3.2023", "quoter": "תומר", "quoted": "ניר", "text": "אפשר לעשות מזה חרדל", "id": 574}, {"date": "21.3.2023", "quoter": "רון", "quoted": "תומר", "text": "חזק ברגשות", "id": 575}, {"date": "21.3.2023", "quoter": "תומר", "quoted": "ניר", "text": "יש לך פה גן חיות של חתולים", "id": 576}, {"date": "21.3.2023", "quoter": "תומר", "quoted": "רון", "text": "יש איזה שוקולד פה באזור", "id": 577}, {"date": "21.3.2023", "quoter": "תומר", "quoted": "יניב", "text": "גם באמצע השבוע אני מתעצל קצת", "id": 578}, {"date": "21.3.2023", "quoter": "תומר", "quoted": "יניב", "text": "קשה לי לשלוח", "id": 579}, {"date": "21.3.2023", "quoter": "תומר", "quoted": "ניר", "text": "וזהו הסיסו של ישראכרט", "id": 580}, {"date": "20.3.2023", "quoter": "תומר", "quoted": "רון", "text": "זה גם לא מרטיב לך את הכפות אצבעות", "id": 581}, {"date": "20.3.2023", "quoter": "רון", "quoted": "תומר", "text": "פרגית חופש", "id": 582}, {"date": "17.3.2023", "quoter": "תומר", "quoted": "רון", "text": "מה זה .. סינדרלה ושבעת הגמדים", "id": 583}, {"date": "16.3.2023", "quoter": "תומר", "quoted": "יובל מ.", "text": "תזכירו לי , לא להעביר אלי יותר", "id": 584}, {"date": "16.3.2023", "quoter": "תומר", "quoted": "רון", "text": "בלאט גדול היה פה", "id": 585}, {"date": "13.3.2023", "quoter": "תומר", "quoted": "שלומי", "text": "המקום האחרון זה הראשון החדש", "id": 586}, {"date": "13.3.2023", "quoter": "תומר", "quoted": "רון", "text": "יש סדר ויש גזר", "id": 587}, {"date": "13.3.2023", "quoter": "תומר", "quoted": "שלומי", "text": "אני לא צ’ק , אני ביג", "id": 588}, {"date": "6.3.2023", "quoter": "תומר", "quoted": "ניר", "text": "…. העו״ד שלהם זה דרור בן שמואל", "id": 589}, {"date": "28.2.2023", "quoter": "תומר", "quoted": "יניב", "text": "יש לי בעיה בטלפון בגלל אובר דאטה", "id": 590}, {"date": "28.2.2023", "quoter": "רם", "quoted": "רון", "text": "אני כולי כמו אשת לוט… מלוח!", "id": 591}, {"date": "28.2.2023", "quoter": "רם", "quoted": "ניר", "text": "(לשגיא) אתה מראה ל AI שיש BI", "id": 592}, {"date": "27.2.2023", "quoter": "רם", "quoted": "תומר", "text": "רק אל תהיה מרגרינה", "id": 593}, {"date": "27.2.2023", "quoter": "תומר", "quoted": "רון", "text": "ניסע לעשות ניתוח של מחלת מין . , ויצא לו מחלה", "id": 594}, {"date": "24.2.2023", "quoter": "אלון", "quoted": "תומר", "text": "יש לך משהו עצוב בשיניים", "id": 595}, {"date": "23.2.2023", "quoter": "תומר", "quoted": "רון", "text": "חוזרים עם הלשון בין הידיים", "id": 596}, {"date": "23.2.2023", "quoter": "תומר", "quoted": "ניר", "text": "אני חי את החלום , מה לעשות ? 🤷🏾‍♂️", "id": 597}, {"date": "23.2.2023", "quoter": "תומר", "quoted": "רון", "text": "עשה בפטרן אחר", "id": 598}, {"date": "21.2.2023", "quoter": "תומר", "quoted": "רון", "text": "תורנות סע סע  ( נשק וסע …)", "id": 599}, {"date": "20.2.2023", "quoter": "תומר", "quoted": "רון", "text": "אננננייי", "id": 600}, {"date": "20.2.2023", "quoter": "רון", "quoted": "תומר", "text": "הד אנד שולדרז זה לידת עכוז", "id": 601}, {"date": "20.2.2023", "quoter": "תומר", "quoted": "רון", "text": "שמה נחפש את מה שאנחנו מוצאים ?", "id": 602}, {"date": "20.2.2023", "quoter": "רון", "quoted": "תומר", "text": "אבא משמין", "id": 603}, {"date": "17.2.2023", "quoter": "תומר", "quoted": "רון", "text": "אתה ממש ריצ’ארד כליף", "id": 604}, {"date": "17.2.2023", "quoter": "תומר", "quoted": "שראל", "text": "איזה ריח של פיסטוקים  יש לך", "id": 605}, {"date": "17.2.2023", "quoter": "אלון", "quoted": "תומר", "text": "בוא נלך על מיזם. אנחנו מביאים ת׳שם", "id": 606}, {"date": "17.2.2023", "quoter": "תומר", "quoted": "ניר", "text": "בבית של אנה פרנק היה יותר", "id": 607}, {"date": "17.2.2023", "quoter": "תומר", "quoted": "ניר", "text": "כל חמש מטר מרובע רון פוגש מישהו", "id": 608}, {"date": "16.2.2023", "quoter": "רם", "quoted": "רון", "text": "רעו ביחד באחו", "id": 609}, {"date": "14.2.2023", "quoter": "תומר", "quoted": "רון", "text": "בזמן שאתה מכין אחד , אני מכין פקאט", "id": 610}, {"date": "13.2.2023", "quoter": "תומר", "quoted": "יניב", "text": "שיחקתי נגד העקרון שלי", "id": 611}, {"date": "13.2.2023", "quoter": "תומר", "quoted": "שלומי", "text": "מפסעות אחרי ספורט", "id": 612}, {"date": "10.2.2023", "quoter": "אלון", "quoted": "רון", "text": "איפה ייכנסו כולם?", "id": 613}, {"date": "10.2.2023", "quoter": "רון", "quoted": "תומר", "text": "תהיו החלטיים בהחלטות שלכם", "id": 614}, {"date": "10.2.2023", "quoter": "תומר", "quoted": "רון", "text": "ספרדי קשיש", "id": 615}, {"date": "9.2.2023", "quoter": "תומר", "quoted": "רם", "text": "לגילגול הבא", "id": 616}, {"date": "9.2.2023", "quoter": "אלון", "quoted": "ניר", "text": "ואני מדבר איתו גם", "id": 617}, {"date": "9.2.2023", "quoter": "תומר", "quoted": "רון", "text": "זה נחמד זה נחמד", "id": 618}, {"date": "7.2.2023", "quoter": "תומר", "quoted": "שגיא", "text": "אפרופו אילנה דיין … מה עם פורים 🤦🏼‍♂️😂", "id": 619}, {"date": "7.2.2023", "quoter": "יניב", "quoted": "תומר", "text": "פיטר רוט בפיתה", "id": 620}, {"date": "7.2.2023", "quoter": "תומר", "quoted": "ניר", "text": "( לרם ) אם תפגע , תפגע … על הזין שלי", "id": 621}, {"date": "6.2.2023", "quoter": "יניב", "quoted": "תומר", "text": "מרי פופינס של הילדים", "id": 622}, {"date": "6.2.2023", "quoter": "תומר", "quoted": "רון", "text": "( לתומר ) , אתה איש המדיה והדיגיטל", "id": 623}, {"date": "6.2.2023", "quoter": "תומר", "quoted": "רון", "text": "דובוני פוליפים", "id": 624}, {"date": "6.2.2023", "quoter": "תומר", "quoted": "ניר", "text": "אם אני מגיע לארוחת בוקר אז שיהיה כבר סלומון עם צלפים", "id": 625}, {"date": "30.1.2023", "quoter": "רון", "quoted": "רם", "text": "בחלומוות", "id": 626}, {"date": "19.1.2023", "quoter": "תומר", "quoted": "כליפא", "text": "אני ממש בכושר … אחרי יום שכזה אני לא מרגיש עייף בכלל", "id": 627}, {"date": "16.1.2023", "quoter": "רם", "quoted": "תומר", "text": "אוטוטו מגיעים לאנשהו.. (תומר מגלה את רכבת ישראל 🚂)", "id": 628}, {"date": "13.1.2023", "quoter": "רון", "quoted": "תומר", "text": "פיאנו נואר", "id": 629}, {"date": "12.1.2023", "quoter": "רון", "quoted": "תומר", "text": "זה לא הפורטה שלהם", "id": 630}, {"date": "10.1.2023", "quoter": "תומר", "quoted": "ניר", "text": "אל תיכנס עם זה למיקרו גל", "id": 631}, {"date": "10.1.2023", "quoter": "רון", "quoted": "תומר", "text": "אושיצקי", "id": 632}, {"date": "9.1.2023", "quoter": "תומר", "quoted": "יניב", "text": "כבר שכחנו מזה …😂", "id": 633}, {"date": "9.1.2023", "quoter": "תומר", "quoted": "יניב", "text": "דן כנר זה פדופיל קלאסי", "id": 634}, {"date": "9.1.2023", "quoter": "תומר", "quoted": "רון", "text": "זאת משפחה !!!! 😂", "id": 635}, {"date": "6.1.2023", "quoter": "תומר", "quoted": "יניב", "text": "אני מרגיש כמו חמת גדר", "id": 636}, {"date": "6.1.2023", "quoter": "תומר", "quoted": "יניב", "text": "זה כמו סהרה", "id": 637}, {"date": "30.12.2022", "quoter": "תומר", "quoted": "יניב", "text": "חתול אוכל ברבור", "id": 638}, {"date": "30.12.2022", "quoter": "תומר", "quoted": "רון", "text": "אבל ברבור לא פרייאר", "id": 639}, {"date": "30.12.2022", "quoter": "תומר", "quoted": "רון", "text": "סטודטאליים שכאלו", "id": 640}, {"date": "30.12.2022", "quoter": "תומר", "quoted": "יניב", "text": "אתה זריז כמו זונה מפריז", "id": 641}, {"date": "30.12.2022", "quoter": "תומר", "quoted": "רון", "text": "ללא הבדל גת גזע ומין", "id": 642}, {"date": "29.12.2022", "quoter": "רון", "quoted": "ניר", "text": "עשה לו פולפולון", "id": 643}, {"date": "29.12.2022", "quoter": "רון", "quoted": "תומר", "text": "על הציצי של פפו", "id": 644}, {"date": "29.12.2022", "quoter": "תומר", "quoted": "בראדלי", "text": "מה עוד אח צריך לעשות ?", "id": 645}, {"date": "29.12.2022", "quoter": "תומר", "quoted": "רון", "text": "איזה ס-ח-ל-ב", "id": 646}, {"date": "29.12.2022", "quoter": "תומר", "quoted": "ניר", "text": "זה לא פה איקאה", "id": 647}, {"date": "29.12.2022", "quoter": "תומר", "quoted": "יניב", "text": "עשית באדי מסאז׳ ?! …. יפה", "id": 648}, {"date": "29.12.2022", "quoter": "רון", "quoted": "תומר", "text": "באופן ידני", "id": 649}, {"date": "26.12.2022", "quoter": "רון", "quoted": "תומר", "text": "מועדים לשפיכה", "id": 650}, {"date": "26.12.2022", "quoter": "תומר", "quoted": "רון", "text": "אומן חצות", "id": 651}, {"date": "26.12.2022", "quoter": "תומר", "quoted": "רון", "text": "אני נכנס ויוצא הרבה ….", "id": 652}, {"date": "26.12.2022", "quoter": "יניב", "quoted": "תומר", "text": "גוצי לא גוצי לידו", "id": 653}, {"date": "26.12.2022", "quoter": "תומר", "quoted": "ניר", "text": "זה חצי כריסמס מה שהולך פה", "id": 654}, {"date": "19.12.2022", "quoter": "שגיא", "quoted": "תומר", "text": ": וואי , ניראה מדהים...", "id": 655}, {"date": "15.12.2022", "quoter": "תומר", "quoted": "רון", "text": "( על פאף ) צריך לשים במים ולנפח", "id": 656}, {"date": "13.12.2022", "quoter": "יניב", "quoted": "תומר", "text": "ֶ תזונאי תקשורת", "id": 657}, {"date": "12.12.2022", "quoter": "תומר", "quoted": "רון", "text": "אני פה על הכרעיים", "id": 658}, {"date": "12.12.2022", "quoter": "תומר", "quoted": "יניב", "text": "( על החתול ) עוד פה הצולע הזה", "id": 659}, {"date": "12.12.2022", "quoter": "תומר", "quoted": "רון", "text": "שפיכו-מנצין", "id": 660}, {"date": "12.12.2022", "quoter": "תומר", "quoted": "יניב", "text": "דרכון גרמני , זה לדעת שפה …. לעמוד בהימנון", "id": 661}, {"date": "12.12.2022", "quoter": "יניב", "quoted": "תומר", "text": "שתית צוף שלם", "id": 662}, {"date": "8.12.2022", "quoter": "תומר", "quoted": "שראל", "text": "רקע בריצפה", "id": 663}, {"date": "7.12.2022", "quoter": "תומר", "quoted": "רון", "text": "זה ידיים קטנות של ציפלוגים 🙄", "id": 664}, {"date": "6.12.2022", "quoter": "תומר", "quoted": "רון", "text": "( על רונן ) יעשו עליו אומן הטינדר", "id": 665}, {"date": "4.12.2022", "quoter": "תומר", "quoted": "רון", "text": "…. רגע רגע … יש לי רעיון … בעצם אין רעיון", "id": 666}, {"date": "2.12.2022", "quoter": "שראל", "quoted": "רון", "text": "אנחנו אחרי הפרבולה", "id": 667}, {"date": "2.12.2022", "quoter": "תומר", "quoted": "בראדלי", "text": "אני בקול ״רם״", "id": 668}, {"date": "2.12.2022", "quoter": "תומר", "quoted": "שגיא", "text": "עשית לו דייסון", "id": 669}, {"date": "2.12.2022", "quoter": "תומר", "quoted": "רון", "text": "אל תגיד דברים בשם אומרם", "id": 670}, {"date": "2.12.2022", "quoter": "תומר", "quoted": "רון", "text": "בכור מחצבתחה", "id": 671}, {"date": "1.12.2022", "quoter": "תומר", "quoted": "רון", "text": "הוא אשכרא יפני", "id": 672}, {"date": "27.11.2022", "quoter": "רון", "quoted": "תומר", "text": "מרכז פרס לשלום ולהתראות", "id": 673}, {"date": "27.11.2022", "quoter": "רון", "quoted": "תומר", "text": "לחייי עוד הרבה מונדיאלים שבדרך", "id": 674}, {"date": "27.11.2022", "quoter": "תומר", "quoted": "יניב", "text": "ה VAR זה רק בדיעבד", "id": 675}, {"date": "25.11.2022", "quoter": "תומר", "quoted": "ניר", "text": "אני לא חד זוית", "id": 676}, {"date": "25.11.2022", "quoter": "תומר", "quoted": "יניב", "text": "כל שפריץ אני מריח", "id": 677}, {"date": "22.11.2022", "quoter": "תומר", "quoted": "יניב", "text": "מה לעשות …. מישהו צריך לתת את הראש שלו", "id": 678}, {"date": "22.11.2022", "quoter": "תומר", "quoted": "ניר", "text": "יש עיר שלמה של גמדים שחורים", "id": 679}, {"date": "22.11.2022", "quoter": "תומר", "quoted": "יניב", "text": "אנשים לא יודע להרים פה אף", "id": 680}, {"date": "22.11.2022", "quoter": "תומר", "quoted": "רם", "text": "טוב שאני שותה מבקבוק סגור", "id": 681}, {"date": "22.11.2022", "quoter": "תומר", "quoted": "רון", "text": "אם רם נוסע על אופנוע …. אז … רם נוסע על אופנוע", "id": 682}, {"date": "22.11.2022", "quoter": "רון", "quoted": "יניב", "text": "כמו כלה ביום ביתוק בתוליה", "id": 683}, {"date": "22.11.2022", "quoter": "רון", "quoted": "תומר", "text": "אל תנסה לזכור מה שאין לו עתיד", "id": 684}, {"date": "21.11.2022", "quoter": "תומר", "quoted": "רון", "text": "בזק שמו אותי בהולד אינסופי", "id": 685}, {"date": "21.11.2022", "quoter": "תומר", "quoted": "ניר", "text": "אם יש לי 6 , יש לי קלינ׳ג", "id": 686}, {"date": "18.11.2022", "quoter": "תומר", "quoted": "בראדלי", "text": "תקשיב … קנאביס זה זהב", "id": 687}, {"date": "18.11.2022", "quoter": "תומר", "quoted": "רון", "text": "העליתא של הלואו", "id": 688}, {"date": "17.11.2022", "quoter": "תומר", "quoted": "ניר", "text": "אין יין בבית", "id": 689}, {"date": "17.11.2022", "quoter": "תומר", "quoted": "רון", "text": "אני קולה 46 אבל הולך ומצטמק", "id": 690}, {"date": "15.11.2022", "quoter": "תומר", "quoted": "ניר", "text": "אתה לא יכול לתקוע להם מזלג בין העיניים", "id": 691}, {"date": "15.11.2022", "quoter": "תומר", "quoted": "יניב", "text": "וואלה דוב קואלה", "id": 692}, {"date": "15.11.2022", "quoter": "יניב", "quoted": "רון", "text": "ֶעוד עשר שנים אנחנו או אברכים או בורחים", "id": 693}, {"date": "15.11.2022", "quoter": "תומר", "quoted": "רון", "text": "( לשגיא ) היית בחיל הים או בצוללות", "id": 694}, {"date": "15.11.2022", "quoter": "תומר", "quoted": "ניר", "text": "זה לא הבונים החופשים פה", "id": 695}, {"date": "15.11.2022", "quoter": "רון", "quoted": "תומר", "text": "בעזרת הטרן", "id": 696}, {"date": "15.11.2022", "quoter": "רון", "quoted": "ניר", "text": "ד\"ר סגל מומחה אצבעות", "id": 697}, {"date": "15.11.2022", "quoter": "תומר", "quoted": "רון", "text": "אני רוצה רק לעדכן לכם את המלאי", "id": 698}, {"date": "15.11.2022", "quoter": "תומר", "quoted": "רון", "text": "אתם פשוט קצרים וקנאים", "id": 699}, {"date": "15.11.2022", "quoter": "תומר", "quoted": "רון", "text": "( לניר ) אתה רוצה לשים אותי ברסן", "id": 700}, {"date": "15.11.2022", "quoter": "תומר", "quoted": "רון", "text": "לוקי לוקי , נו טאצי", "id": 701}, {"date": "11.11.2022", "quoter": "תומר", "quoted": "רון", "text": "היום באמת שמתי לב שהבית מעוצב בטיב טעם", "id": 702}, {"date": "10.11.2022", "quoter": "תומר", "quoted": "שראל", "text": "אומהה בארון", "id": 703}, {"date": "8.11.2022", "quoter": "רון", "quoted": "תומר", "text": "רות סירקיס בהרט", "id": 704}, {"date": "8.11.2022", "quoter": "יניב", "quoted": "תומר", "text": "ֶ אין לך דרך לתקן את העוול הזה", "id": 705}, {"date": "8.11.2022", "quoter": "תומר", "quoted": "רון", "text": "עזוב עזוב גם ככה כולם חצי וולט", "id": 706}, {"date": "7.11.2022", "quoter": "רון", "quoted": "תומר", "text": "יהיה לך רומני תגיע לשחקים", "id": 707}, {"date": "4.11.2022", "quoter": "תומר", "quoted": "שראל", "text": "( לרון ) אם אתה היית אמא שלי לא הייתי מפסיק לינוק", "id": 708}, {"date": "4.11.2022", "quoter": "תומר", "quoted": "רון", "text": "יש לנו מסביב כינרת", "id": 709}, {"date": "4.11.2022", "quoter": "תומר", "quoted": "רון", "text": "איך אתה מחזיק פה אוגרים פה …. וחתול תלת רגלי", "id": 710}, {"date": "4.11.2022", "quoter": "תומר", "quoted": "רון", "text": "דם של ווסת", "id": 711}, {"date": "4.11.2022", "quoter": "תומר", "quoted": "רון", "text": "( לשראל ) מה אתה ביבליוגרפי", "id": 712}, {"date": "4.11.2022", "quoter": "רון", "quoted": "שראל", "text": "סכום פעוט לערב מהנה כל כך", "id": 713}, {"date": "1.11.2022", "quoter": "תומר", "quoted": "ניר", "text": "חארדוברי", "id": 714}, {"date": "1.11.2022", "quoter": "תומר", "quoted": "שגיא", "text": "המונוטציה", "id": 715}, {"date": "1.11.2022", "quoter": "תומר", "quoted": "ניר", "text": "כל העשירים קמצנים", "id": 716}, {"date": "1.11.2022", "quoter": "תומר", "quoted": "רון", "text": "אני שומע את הכדורים שורקים", "id": 717}, {"date": "1.11.2022", "quoter": "תומר", "quoted": "רון", "text": "חליל צייד", "id": 718}, {"date": "31.10.2022", "quoter": "תומר", "quoted": "ניר", "text": "אחת לליקוי חמה זה קורה", "id": 719}, {"date": "31.10.2022", "quoter": "תומר", "quoted": "ניר", "text": "( לרון ) אתה עמוד שדרה מהלך", "id": 720}, {"date": "31.10.2022", "quoter": "רם", "quoted": "יניב", "text": "אי אפשר לכתוב את זה גם", "id": 721}, {"date": "31.10.2022", "quoter": "תומר", "quoted": "יניב", "text": "העוגן טבע", "id": 722}, {"date": "31.10.2022", "quoter": "יניב", "quoted": "רון", "text": "ֶאול אין וווזלין", "id": 723}, {"date": "25.10.2022", "quoter": "תומר", "quoted": "רון", "text": "יש בית יוסף …. בית הילל", "id": 724}, {"date": "25.10.2022", "quoter": "תומר", "quoted": "ניר", "text": "עוסק זעיר חדש", "id": 725}, {"date": "25.10.2022", "quoter": "תומר", "quoted": "יניב", "text": "אלא חארות", "id": 726}, {"date": "24.10.2022", "quoter": "תומר", "quoted": "יניב", "text": "זובי ! !! 🤟", "id": 727}, {"date": "21.10.2022", "quoter": "תומר", "quoted": "רון", "text": "יש לנו פה …,", "id": 728}, {"date": "20.10.2022", "quoter": "תומר", "quoted": "רון", "text": "הפחזנות מהשטן", "id": 729}, {"date": "20.10.2022", "quoter": "תומר", "quoted": "רון", "text": "יש פה חצי אדומים וחצי שחורים", "id": 730}, {"date": "18.10.2022", "quoter": "תומר", "quoted": "יניב", "text": "זה יד מוכרת", "id": 731}, {"date": "18.10.2022", "quoter": "תומר", "quoted": "שלומי", "text": "( לאסי ) הוא נע ונץ", "id": 732}, {"date": "18.10.2022", "quoter": "יניב", "quoted": "תומר", "text": "שניהם מתים מתחת לקבר", "id": 733}, {"date": "17.10.2022", "quoter": "תומר", "quoted": "רון", "text": "הגיע החורף שומעים את הנחיתות", "id": 734}, {"date": "17.10.2022", "quoter": "תומר", "quoted": "רון", "text": "אם תיהיה ממש שקט , תשמע גם את הצוללות", "id": 735}, {"date": "17.10.2022", "quoter": "תומר", "quoted": "יניב", "text": "3,7,3 , יש מטוס כזה", "id": 736}, {"date": "17.10.2022", "quoter": "תומר", "quoted": "יניב", "text": "מי עשה אול אין", "id": 737}, {"date": "17.10.2022", "quoter": "תומר", "quoted": "ניר", "text": "( ליניב ) יושב שם כמו ולדימיר ארקדי", "id": 738}, {"date": "15.10.2022", "quoter": "תומר", "quoted": "יניב", "text": "צ׳ק בהפתעה", "id": 739}, {"date": "14.10.2022", "quoter": "תומר", "quoted": "יובל מ.", "text": "שוקולד , קנטה , מסטיק", "id": 740}, {"date": "14.10.2022", "quoter": "תומר", "quoted": "יניב", "text": "איך נולדו כל כך הרבה בנות לבת", "id": 741}, {"date": "13.10.2022", "quoter": "תומר", "quoted": "רון", "text": "אתה צועק , כאלו רצחתי פה חבובות", "id": 742}, {"date": "13.10.2022", "quoter": "תומר", "quoted": "יניב", "text": "הפנקס רושמת", "id": 743}, {"date": "13.10.2022", "quoter": "תומר", "quoted": "יניב", "text": "החומר של הזיכרון", "id": 744}, {"date": "13.10.2022", "quoter": "תומר", "quoted": "רון", "text": "במקום שאתה רואה ברוס ברנר אתה רואה ברוס יימן", "id": 745}, {"date": "13.10.2022", "quoter": "תומר", "quoted": "יניב", "text": "מלח לא מלוח", "id": 746}, {"date": "10.10.2022", "quoter": "יניב", "quoted": "תומר", "text": "בן אל , אם סטטיק לא היה לוקח אותו ( את בן אל )  , הוא היה עוד עיניים גדולות", "id": 747}, {"date": "7.10.2022", "quoter": "תומר", "quoted": "רם", "text": "( על שלומי ) קנה בסתר", "id": 748}, {"date": "7.10.2022", "quoter": "רם", "quoted": "שגיא", "text": "כשאתה פוגע זה לא משנה מה יש לך", "id": 749}, {"date": "7.10.2022", "quoter": "תומר", "quoted": "שגיא", "text": "אני חבר לקנטה", "id": 750}, {"date": "7.10.2022", "quoter": "תומר", "quoted": "רון", "text": "black brother’s", "id": 751}, {"date": "6.10.2022", "quoter": "רון", "quoted": "תומר", "text": "באת קולונוסקופיה", "id": 752}, {"date": "4.10.2022", "quoter": "תומר", "quoted": "שלומי", "text": "תעזבו … אין לי הרפס", "id": 753}, {"date": "30.9.2022", "quoter": "תומר", "quoted": "רון", "text": "יאלה , זה לא שלי", "id": 754}, {"date": "30.9.2022", "quoter": "תומר", "quoted": "ניר", "text": "( לרון ) אתה פרסומת לטבע נאות", "id": 755}, {"date": "30.9.2022", "quoter": "תומר", "quoted": "ניר", "text": "( לאלון ) לפעמים החגיגה נגמרת", "id": 756}, {"date": "29.9.2022", "quoter": "תומר", "quoted": "שראל", "text": "איך השקעים בגומות מתחברים", "id": 757}, {"date": "29.9.2022", "quoter": "תומר", "quoted": "יניב", "text": "נסעתי לאילת …. והספר שלי אמר לי", "id": 758}, {"date": "28.9.2022", "quoter": "תומר", "quoted": "רון", "text": "קובנית מגולגלת בפיתה", "id": 759}, {"date": "28.9.2022", "quoter": "יניב", "quoted": "רון", "text": "הגורל מתנכר לאלה שהורסים קוקוריקו", "id": 760}, {"date": "27.9.2022", "quoter": "תומר", "quoted": "בראדלי", "text": "למה ?!?!…..", "id": 761}, {"date": "20.9.2022", "quoter": "תומר", "quoted": "ניר", "text": "ההסבר מניח את הדעת", "id": 762}, {"date": "20.9.2022", "quoter": "תומר", "quoted": "שלומי", "text": "הכל נגמר במגב", "id": 763}, {"date": "20.9.2022", "quoter": "תומר", "quoted": "רון", "text": "סילונית בן השיניים", "id": 764}, {"date": "20.9.2022", "quoter": "תומר", "quoted": "שלומי", "text": "תאכלס אבל איך התחתית", "id": 765}, {"date": "16.9.2022", "quoter": "תומר", "quoted": "בראדלי", "text": "( אל רון ) אתה רון מאסטר", "id": 766}, {"date": "16.9.2022", "quoter": "רון", "quoted": "תומר", "text": "מה תעשה לא תגרד?", "id": 767}, {"date": "16.9.2022", "quoter": "רון", "quoted": "תומר", "text": "נשים עיפות זה כולרה", "id": 768}, {"date": "16.9.2022", "quoter": "תומר", "quoted": "רון", "text": "וואי 😱 איזה ריקון", "id": 769}, {"date": "16.9.2022", "quoter": "רם", "quoted": "תומר", "text": "זה לא רון שאני מכיר מלפני 20 דקות", "id": 770}, {"date": "15.9.2022", "quoter": "תומר", "quoted": "רון", "text": "כל היד שלו מרוצפת ( על רונן )", "id": 771}, {"date": "13.9.2022", "quoter": "תומר", "quoted": "שלומי", "text": "רוצה פלפל חריף", "id": 772}, {"date": "4.9.2022", "quoter": "תומר", "quoted": "רון", "text": "אתה קופץ מעל תורי", "id": 773}, {"date": "4.9.2022", "quoter": "תומר", "quoted": "רון", "text": "יאלה .. ,… ערב ללא תזונה", "id": 774}, {"date": "26.8.2022", "quoter": "יניב", "quoted": "רון", "text": "שלא תדע קינוח", "id": 775}, {"date": "26.8.2022", "quoter": "תומר", "quoted": "רון", "text": "אתם באים ליבגי", "id": 776}, {"date": "26.8.2022", "quoter": "תומר", "quoted": "יניב", "text": "אני כל כך נהנתי באקדודו , אני רק הסתכלתי", "id": 777}, {"date": "26.8.2022", "quoter": "תומר", "quoted": "יניב", "text": "מה שהכי מפיל אותך זה מי סוכר ושמש", "id": 778}, {"date": "23.8.2022", "quoter": "רון", "quoted": "תומר", "text": "מישהו צריך לשמור על הבולדוג שלא יתפרץ", "id": 779}, {"date": "23.8.2022", "quoter": "תומר", "quoted": "רון", "text": "בוא ניסע לג׳רוסי", "id": 780}, {"date": "19.8.2022", "quoter": "תומר", "quoted": "רון", "text": "איך אתה נראה מקומט", "id": 781}, {"date": "19.8.2022", "quoter": "תומר", "quoted": "רון", "text": "את האוהב אנוש אתה מפתה", "id": 782}, {"date": "19.8.2022", "quoter": "רון", "quoted": "שראל", "text": "נציב כבולים החיילים", "id": 783}, {"date": "19.8.2022", "quoter": "תומר", "quoted": "רון", "text": "הוא קלסי לגנב״צ זרע", "id": 784}, {"date": "18.8.2022", "quoter": "תומר", "quoted": "רון", "text": "אל תיהיה לי הקוזינה של רונן", "id": 785}, {"date": "16.8.2022", "quoter": "תומר", "quoted": "יניב", "text": "אפשר לצ׳קצ׳ק למוות", "id": 786}, {"date": "16.8.2022", "quoter": "רון", "quoted": "תומר", "text": "יועץ הנקה של בירות", "id": 787}, {"date": "16.8.2022", "quoter": "תומר", "quoted": "יניב", "text": "אני הייתי נותן לו צאקלה קטן", "id": 788}, {"date": "16.8.2022", "quoter": "תומר", "quoted": "ניר", "text": "שלומי לקחתי לך 21 ציפ", "id": 789}, {"date": "12.8.2022", "quoter": "תומר", "quoted": "בראדלי", "text": "זה אסקלציה", "id": 790}, {"date": "12.8.2022", "quoter": "תומר", "quoted": "ניר", "text": "למען הבגט", "id": 791}, {"date": "12.8.2022", "quoter": "תומר", "quoted": "רון", "text": "יצאת בשן וזין", "id": 792}, {"date": "12.8.2022", "quoter": "תומר", "quoted": "ניר", "text": "אלון ובניו", "id": 793}, {"date": "12.8.2022", "quoter": "תומר", "quoted": "שראל", "text": "לקחנו שם אדם כל העירה", "id": 794}, {"date": "9.8.2022", "quoter": "תומר", "quoted": "ניר", "text": "העולם קצר", "id": 795}, {"date": "9.8.2022", "quoter": "תומר", "quoted": "ניר", "text": "קפוץ למקרר ותראה", "id": 796}, {"date": "9.8.2022", "quoter": "תומר", "quoted": "יניב", "text": "לך על עתיד קצר", "id": 797}, {"date": "9.8.2022", "quoter": "תומר", "quoted": "רון", "text": "איך רעב הייתי", "id": 798}, {"date": "9.8.2022", "quoter": "תומר", "quoted": "רון", "text": "היום זה יום התחתית", "id": 799}, {"date": "9.8.2022", "quoter": "תומר", "quoted": "שגיא", "text": "איך הצלתי את כולם ( הבחור עם 7:2 ולוקח 😂)", "id": 800}, {"date": "9.8.2022", "quoter": "תומר", "quoted": "ניר", "text": "( ליניב ) עשית נועה קיריל", "id": 801}, {"date": "8.8.2022", "quoter": "רם", "quoted": "תומר", "text": "אמן יהיה סלע", "id": 802}, {"date": "8.8.2022", "quoter": "תומר", "quoted": "רון", "text": "אז איך אמרת קוראים לאתר סקי … פוטנה", "id": 803}, {"date": "8.8.2022", "quoter": "תומר", "quoted": "יניב", "text": "ניר תביא לי בירה כבר", "id": 804}, {"date": "8.8.2022", "quoter": "תומר", "quoted": "יניב", "text": "אחלה בירה", "id": 805}, {"date": "5.8.2022", "quoter": "תומר", "quoted": "יניב", "text": "מיול טארק", "id": 806}, {"date": "5.8.2022", "quoter": "תומר", "quoted": "יניב", "text": "לקחה איתה את הקלרינט", "id": 807}, {"date": "5.8.2022", "quoter": "תומר", "quoted": "רון", "text": "תאכל ביק , תאכל ביק", "id": 808}, {"date": "4.8.2022", "quoter": "תומר", "quoted": "יניב", "text": "ראש מדור אינטגרציה ….", "id": 809}, {"date": "4.8.2022", "quoter": "תומר", "quoted": "דניאל", "text": "לחיי מחלקת אינטגרציה", "id": 810}, {"date": "2.8.2022", "quoter": "תומר", "quoted": "יניב", "text": "נעשה לך רייכמן", "id": 811}, {"date": "2.8.2022", "quoter": "תומר", "quoted": "ניר", "text": "אריק סיני תמיד טוב אחרי מוחיטו", "id": 812}, {"date": "1.8.2022", "quoter": "תומר", "quoted": "ניר", "text": "עוד שניה נלך להביא כדי מים", "id": 813}, {"date": "29.7.2022", "quoter": "תומר", "quoted": "יובל מ.", "text": "אתה רץ 😂 ( כושר בהודו …)", "id": 814}, {"date": "29.7.2022", "quoter": "אסף", "quoted": "תומר", "text": "בועז ארוגב, תגיד תודה על מה שקיבלת", "id": 815}, {"date": "28.7.2022", "quoter": "תומר", "quoted": "יובל מ.", "text": "קרה מראה", "id": 816}, {"date": "28.7.2022", "quoter": "תומר", "quoted": "בראדלי", "text": "הוא היה פראש", "id": 817}, {"date": "26.7.2022", "quoter": "תומר", "quoted": "ניר", "text": "( שמוליק ) לא בא לך לדבר על עצמך", "id": 818}, {"date": "26.7.2022", "quoter": "תומר", "quoted": "ניר", "text": "יניב יד אדם", "id": 819}, {"date": "25.7.2022", "quoter": "יניב", "quoted": "ניר", "text": "מקלות צופ צופ", "id": 820}, {"date": "25.7.2022", "quoter": "תומר", "quoted": "ניר", "text": "תומר זה כמו בדרום", "id": 821}, {"date": "25.7.2022", "quoter": "תומר", "quoted": "שראל", "text": "תאורטי , כן ?", "id": 822}, {"date": "25.7.2022", "quoter": "תומר", "quoted": "יניב", "text": "תעשה אומהה שזה יאזן את הבלגן", "id": 823}, {"date": "21.7.2022", "quoter": "רון", "quoted": "תומר", "text": "כמו מיניון בבננה", "id": 824}, {"date": "20.7.2022", "quoter": "תומר", "quoted": "רון", "text": "( לניר ) כמה על השעון אצלך 🤦🏼‍♂️", "id": 825}, {"date": "20.7.2022", "quoter": "תומר", "quoted": "ניר", "text": "אם אתה בנאדם שלא רגוע אז אתה עצבני", "id": 826}, {"date": "19.7.2022", "quoter": "תומר", "quoted": "ניר", "text": "יום זיכרון שמח", "id": 827}, {"date": "19.7.2022", "quoter": "רון", "quoted": "ניר", "text": "יניב הלך לעשות AirBnB", "id": 828}, {"date": "19.7.2022", "quoter": "תומר", "quoted": "רון", "text": "האיש שבלקרדה ינצח", "id": 829}, {"date": "18.7.2022", "quoter": "תומר", "quoted": "יניב", "text": "2:7 מבטל קופה 😂🤦🏼‍♂️", "id": 830}, {"date": "15.7.2022", "quoter": "תומר", "quoted": "ניר", "text": "חאפצורי 🤦🏼‍♂️", "id": 831}, {"date": "15.7.2022", "quoter": "תומר", "quoted": "רון", "text": "רונן ואפיפית", "id": 832}, {"date": "15.7.2022", "quoter": "תומר", "quoted": "רון", "text": "אני כבר שעה מת להשתין", "id": 833}, {"date": "8.7.2022", "quoter": "תומר", "quoted": "בראדלי", "text": "חארות של קלפים", "id": 834}, {"date": "8.7.2022", "quoter": "תומר", "quoted": "רון", "text": "סינג וסנאג , תקן את המזגן", "id": 835}, {"date": "4.7.2022", "quoter": "תומר", "quoted": "יניב", "text": "סלט דבש", "id": 836}, {"date": "3.7.2022", "quoter": "תומר", "quoted": "יניב", "text": "מסוק הרימו , אז מה זה 35 נקודות 😂😂", "id": 837}, {"date": "3.7.2022", "quoter": "תומר", "quoted": "רון", "text": "איזה טוסטוסון אתה", "id": 838}, {"date": "3.7.2022", "quoter": "תומר", "quoted": "יניב", "text": "baybesiter", "id": 839}, {"date": "3.7.2022", "quoter": "תומר", "quoted": "רון", "text": "לשון נופל על לשון ( זה סרט של לסביות )", "id": 840}, {"date": "1.7.2022", "quoter": "תומר", "quoted": "יניב", "text": "גואקמולי ומטבוחה", "id": 841}, {"date": "1.7.2022", "quoter": "תומר", "quoted": "ניר", "text": "מונולוג מהוג׳יינה", "id": 842}, {"date": "1.7.2022", "quoter": "תומר", "quoted": "ניר", "text": "יהיה פה קדיש", "id": 843}, {"date": "1.7.2022", "quoter": "תומר", "quoted": "יניב", "text": "קח לדרמן ושקאל", "id": 844}, {"date": "30.6.2022", "quoter": "יניב", "quoted": "ניר", "text": "עם נשים (לא שלנו) וגריי גוס", "id": 845}, {"date": "28.6.2022", "quoter": "תומר", "quoted": "רון", "text": "סיעת דה שמעיה", "id": 846}, {"date": "27.6.2022", "quoter": "תומר", "quoted": "שראל", "text": "( לרון ) אני מאחל לך תמיד להיות בצד הנותן ולא המקבל", "id": 847}, {"date": "21.6.2022", "quoter": "תומר", "quoted": "יניב", "text": "אני מרגיש שהוא מנסר לי את החיים .", "id": 848}, {"date": "21.6.2022", "quoter": "תומר", "quoted": "בראדלי", "text": "מת העולם", "id": 849}, {"date": "20.6.2022", "quoter": "תומר", "quoted": "רון", "text": "אני את שלי עבר עשיתי , דפקתי 2 ג’וקים", "id": 850}, {"date": "17.6.2022", "quoter": "יניב", "quoted": "תומר", "text": "למטה זה אותו חרא", "id": 851}, {"date": "17.6.2022", "quoter": "יניב", "quoted": "תומר", "text": "יהרגו יותר חלומי", "id": 852}, {"date": "17.6.2022", "quoter": "יניב", "quoted": "תומר", "text": "תותים ושסק", "id": 853}, {"date": "16.6.2022", "quoter": "תומר", "quoted": "יניב", "text": "שתזכה לזכרים", "id": 854}, {"date": "16.6.2022", "quoter": "תומר", "quoted": "יניב", "text": "שים אותה רגע על זקנה", "id": 855}, {"date": "14.6.2022", "quoter": "תומר", "quoted": "ניר", "text": "דובי אבטיח", "id": 856}, {"date": "5.6.2022", "quoter": "רון", "quoted": "שראל", "text": "עשה לו עקידת יצחק", "id": 857}, {"date": "28.5.2022", "quoter": "תומר", "quoted": "יניב", "text": "פיזמון", "id": 858}, {"date": "26.5.2022", "quoter": "רם", "quoted": "רון", "text": "את נשואה להערצה", "id": 859}, {"date": "26.5.2022", "quoter": "תומר", "quoted": "שלומי", "text": "מי זה הקטן הזה , דיקו ?", "id": 860}, {"date": "24.5.2022", "quoter": "תומר", "quoted": "יניב", "text": "רונן ניהיה רגיש", "id": 861}, {"date": "24.5.2022", "quoter": "תומר", "quoted": "יניב", "text": "הרגשתי עכשיו רעידת אדמה ( אמיתי !)", "id": 862}, {"date": "24.5.2022", "quoter": "תומר", "quoted": "יניב", "text": "דפקנו צחוק בריא", "id": 863}, {"date": "23.5.2022", "quoter": "תומר", "quoted": "יניב", "text": "זה מפסיק להשפיע עלי ( על וודקה )", "id": 864}, {"date": "23.5.2022", "quoter": "תומר", "quoted": "יניב", "text": "מה זה אפיקומן", "id": 865}, {"date": "23.5.2022", "quoter": "תומר", "quoted": "רון", "text": "יש מינוח כזה", "id": 866}, {"date": "20.5.2022", "quoter": "תומר", "quoted": "רון", "text": "😂 הוא הפך להיות כושי", "id": 867}, {"date": "20.5.2022", "quoter": "תומר", "quoted": "רון", "text": "אתם תהיו מורמים מעם", "id": 868}, {"date": "20.5.2022", "quoter": "תומר", "quoted": "ניר", "text": "מספר שלא מתחלק בעצמו", "id": 869}, {"date": "20.5.2022", "quoter": "תומר", "quoted": "ניר", "text": "העברתי לבן שלי קורס השבוע …", "id": 870}, {"date": "20.5.2022", "quoter": "תומר", "quoted": "ניר", "text": "שמעת על ברדלי מנהיג חדש", "id": 871}, {"date": "20.5.2022", "quoter": "תומר", "quoted": "רון", "text": "הכי גרוע שלהם", "id": 872}, {"date": "20.5.2022", "quoter": "תומר", "quoted": "ניר", "text": "אתה ספורט אלגנט", "id": 873}, {"date": "20.5.2022", "quoter": "תומר", "quoted": "שראל", "text": "פסטה לטוסיק", "id": 874}, {"date": "17.5.2022", "quoter": "יניב", "quoted": "תומר", "text": "או דקטלון", "id": 875}, {"date": "16.5.2022", "quoter": "רון", "quoted": "תומר", "text": "דם שלנו זה דם מלאכותי", "id": 876}, {"date": "14.5.2022", "quoter": "תומר", "quoted": "רון", "text": "רוסי יווני , העיקר שיכור", "id": 877}, {"date": "14.5.2022", "quoter": "תומר", "quoted": "יניב", "text": "רק עכשיו ראיתי את הצבע", "id": 878}, {"date": "13.5.2022", "quoter": "תומר", "quoted": "יניב", "text": "אני לא יודע בכלל עם אני יגיע לגיל 50 🤦🏼‍♂️😳", "id": 879}, {"date": "13.5.2022", "quoter": "תומר", "quoted": "יניב", "text": "אני מרגיש כמו פסח פה 🤦🏼‍♂️", "id": 880}, {"date": "13.5.2022", "quoter": "תומר", "quoted": "ניר", "text": "אתה דויד ברוזה של הווצאפים", "id": 881}, {"date": "13.5.2022", "quoter": "תומר", "quoted": "יניב", "text": "אני מרגיש בנרקוס", "id": 882}, {"date": "13.5.2022", "quoter": "תומר", "quoted": "ניר", "text": "תכף נשקה אותם , שלא ילכו לבזר", "id": 883}, {"date": "13.5.2022", "quoter": "תומר", "quoted": "ניר", "text": "לאן אתם הולכות כל הזמן", "id": 884}, {"date": "13.5.2022", "quoter": "תומר", "quoted": "יניב", "text": "בקצוות הם עושים בדיוק כמונו", "id": 885}, {"date": "13.5.2022", "quoter": "תומר", "quoted": "יניב", "text": "עכשיו אני רואה כמה שמן יש בשמן שיזוף", "id": 886}, {"date": "9.5.2022", "quoter": "תומר", "quoted": "רון", "text": "נפלה לי מחשבה", "id": 887}, {"date": "9.5.2022", "quoter": "רון", "quoted": "ניר", "text": "יניב כבר מתחיל לשלם את סיני", "id": 888}, {"date": "9.5.2022", "quoter": "תומר", "quoted": "רון", "text": "הקדמתם קנה לווסת", "id": 889}, {"date": "9.5.2022", "quoter": "רון", "quoted": "תומר", "text": "תקשורת זה לא רק נגמר במכות זה גם דיבורים", "id": 890}, {"date": "3.5.2022", "quoter": "תומר", "quoted": "רון", "text": "אני כותב עכשיו לדויד דאור", "id": 891}, {"date": "3.5.2022", "quoter": "תומר", "quoted": "בראדלי", "text": "וואו יורד גשם …. סוף סוף", "id": 892}, {"date": "3.5.2022", "quoter": "תומר", "quoted": "יניב", "text": "אני אחזור משם בלי ריאות", "id": 893}, {"date": "3.5.2022", "quoter": "רם", "quoted": "תומר", "text": "אתה במצב של פחדנות כרגע", "id": 894}, {"date": "3.5.2022", "quoter": "רון", "quoted": "בראדלי", "text": "יש לי תכנית", "id": 895}, {"date": "2.5.2022", "quoter": "רון", "quoted": "תומר", "text": "עשיתי אותך מנהל על בכל הקבוצות שלך (ליניב)", "id": 896}, {"date": "2.5.2022", "quoter": "רם", "quoted": "בראדלי", "text": "כמה רבע פאונד עם צ׳יז אכלתי בחיים…! (בתרגום חופשי)", "id": 897}, {"date": "26.4.2022", "quoter": "תומר", "quoted": "רון", "text": "כח חלוץ לא בודקים", "id": 898}, {"date": "26.4.2022", "quoter": "תומר", "quoted": "רון", "text": "גדול בתורו", "id": 899}, {"date": "26.4.2022", "quoter": "תומר", "quoted": "רון", "text": "זה מעלה את הגיל שאתה מת בו", "id": 900}, {"date": "26.4.2022", "quoter": "תומר", "quoted": "רון", "text": "ישנים כמו תינוקים", "id": 901}, {"date": "26.4.2022", "quoter": "תומר", "quoted": "יניב", "text": "מה קרה לך ולאישתך עם הבירכים ( לרון )", "id": 902}, {"date": "25.4.2022", "quoter": "יניב", "quoted": "תומר", "text": "מאוד נישתי", "id": 903}, {"date": "25.4.2022", "quoter": "תומר", "quoted": "רון", "text": "אין תירסים", "id": 904}, {"date": "25.4.2022", "quoter": "תומר", "quoted": "יניב", "text": "בוא נשב , זה יותר טוב 😂😂", "id": 905}, {"date": "25.4.2022", "quoter": "תומר", "quoted": "שראל", "text": "מה קרה לבירכיים של אישתך ?", "id": 906}, {"date": "20.4.2022", "quoter": "תומר", "quoted": "שגיא", "text": "( לשראל ) היית ספר סגור", "id": 907}, {"date": "19.4.2022", "quoter": "תומר", "quoted": "יניב", "text": "שלומי זה ססנה", "id": 908}, {"date": "19.4.2022", "quoter": "תומר", "quoted": "ניר", "text": "( לשלומי ) כל יום שאתה לא משחק פוקר זה ביזבוז", "id": 909}, {"date": "12.4.2022", "quoter": "תומר", "quoted": "רם", "text": "שתיקה מעיקה", "id": 910}, {"date": "12.4.2022", "quoter": "תומר", "quoted": "ניר", "text": "משך טורכי", "id": 911}, {"date": "8.4.2022", "quoter": "תומר", "quoted": "בראדלי", "text": "שיהיה לך יהיה לך", "id": 912}, {"date": "7.4.2022", "quoter": "תומר", "quoted": "ניר", "text": "או הקונסוליה או שמוליק", "id": 913}, {"date": "7.4.2022", "quoter": "תומר", "quoted": "בראדלי", "text": "הכל לטוב", "id": 914}, {"date": "5.4.2022", "quoter": "שראל", "quoted": "תומר", "text": "זה לא שבוע לשחק פוקר", "id": 915}, {"date": "4.4.2022", "quoter": "יניב", "quoted": "תומר", "text": "בנקאות שקטה", "id": 916}, {"date": "28.3.2022", "quoter": "תומר", "quoted": "שראל", "text": "שלומי יש לך שלמה", "id": 917}, {"date": "22.3.2022", "quoter": "תומר", "quoted": "שראל", "text": "גם יצאתי חבר וגם אח", "id": 918}, {"date": "15.3.2022", "quoter": "תומר", "quoted": "רון", "text": "גם יצאת צדיק וג׳נטלמן", "id": 919}, {"date": "15.3.2022", "quoter": "רון", "quoted": "יניב", "text": "מרכז גראמה לשלום", "id": 920}, {"date": "7.3.2022", "quoter": "יניב", "quoted": "ניר", "text": "זה דונקי מונקי זה", "id": 921}, {"date": "4.3.2022", "quoter": "תומר", "quoted": "רון", "text": "קיבלתי את כל הבררה", "id": 922}, {"date": "3.3.2022", "quoter": "תומר", "quoted": "בראדלי", "text": "אין תמונה עם בשר , בלי יניב", "id": 923}, {"date": "1.3.2022", "quoter": "תומר", "quoted": "רון", "text": "הליכה רגלית", "id": 924}, {"date": "1.3.2022", "quoter": "תומר", "quoted": "רון", "text": "פתאום ככה בא הלילה , וזה חושך", "id": 925}, {"date": "1.3.2022", "quoter": "רון", "quoted": "תומר", "text": "שלומי 300", "id": 926}, {"date": "1.3.2022", "quoter": "תומר", "quoted": "רון", "text": "רזנושקיזקיז", "id": 927}, {"date": "1.3.2022", "quoter": "תומר", "quoted": "שגיא", "text": "( לרון ) רק בשביל הבדיקה", "id": 928}, {"date": "28.2.2022", "quoter": "תומר", "quoted": "ניר", "text": "שגיא שלא יקפוץ לך ה שגיא", "id": 929}, {"date": "25.2.2022", "quoter": "תומר", "quoted": "רם", "text": "יד מהולה בשמחה", "id": 930}, {"date": "25.2.2022", "quoter": "רם", "quoted": "ניר", "text": "שידרת אלג׳זירה", "id": 931}, {"date": "24.2.2022", "quoter": "תומר", "quoted": "בראדלי", "text": "יאלה רוקאנדרול", "id": 932}, {"date": "24.2.2022", "quoter": "תומר", "quoted": "רון", "text": "אוליזומנלי", "id": 933}, {"date": "23.2.2022", "quoter": "תומר", "quoted": "יניב", "text": "ליסה מנאלי", "id": 934}, {"date": "22.2.2022", "quoter": "תומר", "quoted": "שראל", "text": "ריבר שיט", "id": 935}, {"date": "22.2.2022", "quoter": "תומר", "quoted": "רון", "text": "יש לי סטית תקן גדולה", "id": 936}, {"date": "22.2.2022", "quoter": "תומר", "quoted": "בראדלי", "text": "יש לי הרבה קורונה בבית", "id": 937}, {"date": "22.2.2022", "quoter": "תומר", "quoted": "יניב", "text": "לובלבו  זה אח של טורטולו", "id": 938}, {"date": "22.2.2022", "quoter": "תומר", "quoted": "ניר", "text": "גילחתי את האשכים , אין לך מה לדאוג", "id": 939}, {"date": "22.2.2022", "quoter": "תומר", "quoted": "יניב", "text": "חייבים להקריב את האחים", "id": 940}, {"date": "18.2.2022", "quoter": "רון", "quoted": "יניב", "text": "תגביר שנשמע את השקט", "id": 941}, {"date": "18.2.2022", "quoter": "רון", "quoted": "ניר", "text": "יכול לקבל הנחה בארנונה", "id": 942}, {"date": "18.2.2022", "quoter": "רון", "quoted": "יניב", "text": "נועם עשית את לחמך", "id": 943}, {"date": "18.2.2022", "quoter": "רון", "quoted": "ניר", "text": "רב חובל סקיפר ראשון", "id": 944}, {"date": "18.2.2022", "quoter": "רון", "quoted": "יניב", "text": "מפה אתה לבד", "id": 945}, {"date": "16.2.2022", "quoter": "רון", "quoted": "תומר", "text": "ירכיים של קובניות מקולומביה", "id": 946}, {"date": "1.2.2022", "quoter": "יניב", "quoted": "רון", "text": "פוטה דה נורא", "id": 947}, {"date": "1.2.2022", "quoter": "רון", "quoted": "יניב", "text": "פולסא דה פוטה", "id": 948}, {"date": "31.1.2022", "quoter": "תומר", "quoted": "רון", "text": "שיניים של בן זיני", "id": 949}, {"date": "18.1.2022", "quoter": "תומר", "quoted": "ניר", "text": "מונולוג מהויג׳ניה", "id": 950}, {"date": "18.1.2022", "quoter": "יניב", "quoted": "ניר", "text": "בטעם של בונה", "id": 951}, {"date": "18.1.2022", "quoter": "תומר", "quoted": "רם", "text": "תן בבקשה את ה 40 שח שאתה חייב לי לאירוח לרון 🙏", "id": 952}, {"date": "17.1.2022", "quoter": "רון", "quoted": "תומר", "text": "מכה שלא ברא הסרטן", "id": 953}, {"date": "13.1.2022", "quoter": "תומר", "quoted": "ניר", "text": "אני מקשיב לגוף שלי", "id": 954}, {"date": "11.1.2022", "quoter": "תומר", "quoted": "יניב", "text": "יש לו פה מקום לעצים", "id": 955}, {"date": "11.1.2022", "quoter": "תומר", "quoted": "רון", "text": "בוא נזמין טיסות כבר", "id": 956}, {"date": "11.1.2022", "quoter": "תומר", "quoted": "רון", "text": "מה זה פלמינג", "id": 957}, {"date": "11.1.2022", "quoter": "תומר", "quoted": "ניר", "text": "פול ניומן לידו", "id": 958}, {"date": "11.1.2022", "quoter": "תומר", "quoted": "יניב", "text": "שום ורינט לא יעבור את העפר הזה", "id": 959}, {"date": "11.1.2022", "quoter": "תומר", "quoted": "רון", "text": "בוחן עליות", "id": 960}, {"date": "11.1.2022", "quoter": "תומר", "quoted": "שראל", "text": "אני שעה ביג", "id": 961}, {"date": "11.1.2022", "quoter": "יניב", "quoted": "ניר", "text": "תרימו את הדגל לחצי התורן", "id": 962}, {"date": "4.1.2022", "quoter": "יניב", "quoted": "תומר", "text": "עאסל זה טוב או רע ?", "id": 963}, {"date": "28.12.2021", "quoter": "תומר", "quoted": "רון", "text": "נזקים רודפים נזקים", "id": 964}, {"date": "28.12.2021", "quoter": "תומר", "quoted": "רון", "text": "נאן טיקן", "id": 965}, {"date": "27.12.2021", "quoter": "יניב", "quoted": "רון", "text": "ציפיים טבעם להיאכל", "id": 966}, {"date": "27.12.2021", "quoter": "יניב", "quoted": "תומר", "text": "גור אריות מסתובב פה כמו נשר", "id": 967}, {"date": "27.12.2021", "quoter": "תומר", "quoted": "יניב", "text": "צינורות פתוחים גם במשפטים", "id": 968}, {"date": "15.9.2021", "quoter": "תומר", "quoted": "שגיא", "text": "תעשה מנגו", "id": 969}, {"date": "14.9.2021", "quoter": "תומר", "quoted": "רון", "text": "זה ליד ג׳בל עמוד", "id": 970}, {"date": "10.9.2021", "quoter": "תומר", "quoted": "ניר", "text": "איזה חיים בנאלים 🤷🏾‍♂️", "id": 971}, {"date": "10.9.2021", "quoter": "יניב", "quoted": "תומר", "text": "לכל צינור יש מוצ״ש", "id": 972}, {"date": "15.7.2021", "quoter": "תומר", "quoted": "ניר", "text": "מה היה בתוך הגו׳ק , תמר", "id": 973}, {"date": "15.7.2021", "quoter": "רון", "quoted": "תומר", "text": "גהנום של תרנגולים", "id": 974}, {"date": "13.7.2021", "quoter": "תומר", "quoted": "רון", "text": "ערב מתגלגל", "id": 975}];

// ===== אחסון משותף - Firebase Firestore =====
const STORAGE_KEY = 'poker_group_state_v3';
const QUOTES_STORAGE_KEY = 'poker_quotes_state_v1';
const GALLERY_STORAGE_KEY = 'poker_gallery_state_v1';

const loadState = async (key = STORAGE_KEY) => {
  return await fbLoadState(key);
};

const saveState = async (state, key = STORAGE_KEY) => {
  return await fbSaveState(state, key);
};

// ===== חישובי סטטיסטיקה =====
const calculateStats = (sessions, players) => {
  const stats = {};
  players.forEach(p => {
    stats[p] = { name: p, total: 0, sessions: 0, wins: 0, losses: 0, ties: 0,
      maxStreak: 0, currentStreak: 0, biggestWin: 0, biggestLoss: 0, values: [], hosted: 0 };
  });
  const sortedSessions = [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));
  sortedSessions.forEach(session => {
    if (session.host && stats[session.host]) stats[session.host].hosted++;
    Object.entries(session.results || {}).forEach(([name, amount]) => {
      if (!stats[name]) return;
      const s = stats[name];
      s.total += amount; s.sessions++; s.values.push(amount);
      if (amount > 0) { s.wins++; s.currentStreak = Math.max(0, s.currentStreak) + 1; }
      else if (amount < 0) { s.losses++; s.currentStreak = Math.min(0, s.currentStreak) - 1; }
      else { s.ties++; }
      s.maxStreak = Math.max(s.maxStreak, s.currentStreak);
      if (amount > s.biggestWin) s.biggestWin = amount;
      if (amount < s.biggestLoss) s.biggestLoss = amount;
    });
  });
  Object.values(stats).forEach(s => {
    if (s.sessions > 0) {
      s.avg = s.total / s.sessions;
      const variance = s.values.reduce((sum, v) => sum + Math.pow(v - s.avg, 2), 0) / s.sessions;
      s.stdDev = Math.sqrt(variance);
      s.winRate = (s.wins / s.sessions) * 100;
      s.lossRate = (s.losses / s.sessions) * 100;
      s.tieRate = (s.ties / s.sessions) * 100;
    } else {
      s.avg = 0; s.stdDev = 0; s.winRate = 0; s.lossRate = 0; s.tieRate = 0;
    }
  });
  return Object.values(stats).filter(s => s.sessions > 0).sort((a, b) => b.total - a.total);
};

const calculateCumulative = (sessions, selectedPlayers) => {
  const sortedSessions = [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));
  const running = {};
  selectedPlayers.forEach(p => running[p] = 0);
  return sortedSessions.map(session => {
    const point = { date: session.date, label: new Date(session.date).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }) };
    Object.entries(session.results || {}).forEach(([name, amount]) => {
      if (running[name] !== undefined) running[name] += amount;
    });
    selectedPlayers.forEach(p => { point[p] = running[p]; });
    return point;
  });
};

const getLatestSessionDate = (sessions) => {
  if (!sessions.length) return null;
  return [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date))[0].date;
};

const parseHebrewDate = (dateStr) => {
  // "27.6.2021" -> Date
  const [d, m, y] = dateStr.split('.');
  return new Date(+y, +m - 1, +d);
};
// ===== מסך פתיחה טקסס הולדם =====
const SplashScreen = ({ onEnter }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden" style={{ fontFamily: 'Heebo, Assistant, sans-serif' }}>
      {/* טעינת פונט בתוך הסקרין כדי שיעבוד מיד */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;700;800;900&family=Rubik:wght@500;700;900&display=swap" rel="stylesheet" />
      
      {/* רקע פוקר - שולחן ירוק */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, #0f5132 0%, #052e16 50%, #000 100%)',
      }} />
      {/* מרקם שולחן */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, transparent 200px, rgba(0,0,0,0.6) 500px)'
      }} />
      {/* אורות רכים */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-700/20 rounded-full blur-3xl" />

      {/* קלפים מעופפים ברקע */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          { top: '10%', left: '15%', rot: -25, suit: '♠', color: 'text-white' },
          { top: '20%', right: '10%', rot: 15, suit: '♥', color: 'text-red-500' },
          { bottom: '15%', left: '8%', rot: 30, suit: '♦', color: 'text-red-500' },
          { bottom: '25%', right: '15%', rot: -15, suit: '♣', color: 'text-white' },
          { top: '45%', left: '5%', rot: 45, suit: '♥', color: 'text-red-500' },
          { top: '50%', right: '5%', rot: -35, suit: '♠', color: 'text-white' },
        ].map((c, i) => (
          <div key={i} className="absolute" style={{
            ...c, transform: `rotate(${c.rot}deg)`, animation: `floatCard 4s ease-in-out ${i * 0.3}s infinite`
          }}>
            <div className="w-24 h-32 md:w-32 md:h-44 rounded-xl bg-gradient-to-br from-stone-100 to-stone-300 shadow-2xl flex items-center justify-center border-2 border-stone-400 opacity-30">
              <div className={`text-6xl md:text-7xl ${c.color} font-bold`}>{c.suit}</div>
            </div>
          </div>
        ))}
      </div>

      {/* תוכן מרכזי */}
      <div className="relative z-10 text-center px-6 animate-fadeIn" style={{ fontFamily: 'Heebo, Assistant, sans-serif' }}>
        
        {/* לוגו ברבור גדול */}
        <div className="mb-6 flex justify-center animate-swanFloat">
          <img src={BARBUR_LOGO} alt="BarburAI" 
            className="h-32 md:h-44 w-auto drop-shadow-2xl"
            style={{ filter: 'drop-shadow(0 10px 40px rgba(251, 191, 36, 0.4))' }} />
        </div>

        {/* כותרת ראשית */}
        <h1 className="text-4xl md:text-6xl font-black mb-8 leading-tight tracking-tight" style={{
          fontFamily: 'Heebo, Assistant, sans-serif',
          background: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 50%, #b45309 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '0 4px 40px rgba(251, 191, 36, 0.3)'
        }}>
          פוקר ברבורי תל מונד
        </h1>

        {/* סמלי פוקר */}
        <div className="flex justify-center gap-4 mb-10 text-4xl md:text-5xl">
          <span className="text-white drop-shadow-lg" style={{ animation: 'pulseCard 2s ease-in-out infinite' }}>♠</span>
          <span className="text-red-500 drop-shadow-lg" style={{ animation: 'pulseCard 2s ease-in-out 0.3s infinite' }}>♥</span>
          <span className="text-red-500 drop-shadow-lg" style={{ animation: 'pulseCard 2s ease-in-out 0.6s infinite' }}>♦</span>
          <span className="text-white drop-shadow-lg" style={{ animation: 'pulseCard 2s ease-in-out 0.9s infinite' }}>♣</span>
        </div>

        {/* כפתור כניסה */}
        <button onClick={onEnter}
          className="group relative px-12 py-4 text-xl font-extrabold text-stone-900 rounded-full overflow-hidden shadow-2xl hover:scale-105 transition-transform"
          style={{
            fontFamily: 'Heebo, Assistant, sans-serif',
            background: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 50%, #d97706 100%)',
            boxShadow: '0 10px 40px rgba(251, 191, 36, 0.5), inset 0 2px 10px rgba(255,255,255,0.3)'
          }}>
          <span className="relative z-10">כניסה לשולחן</span>
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
        </button>

        <div className="mt-8 text-amber-200/40 text-xs tracking-widest font-bold" style={{ fontFamily: 'Heebo, Assistant, sans-serif' }}>
          ♦ הבית של הפוקר הברבורי ♦
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 1s ease-out; }
        @keyframes floatCard { 0%, 100% { transform: translateY(0) rotate(var(--rot, 0deg)); } 50% { transform: translateY(-30px) rotate(var(--rot, 0deg)); } }
        @keyframes pulseCard { 0%, 100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.15); opacity: 1; } }
        @keyframes swanFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .animate-swanFloat { animation: swanFloat 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

// ===== מודל התחברות מנהל =====
const AdminLoginModal = ({ isOpen, onClose, onLogin, currentUser }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (password !== ADMIN_PASSWORD) { setError('סיסמה שגויה'); return; }
    onLogin(currentUser);
    setPassword(''); setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative w-full max-w-sm rounded-2xl border border-amber-900/50 bg-stone-950 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-400" />
            <h2 className="text-xl font-bold text-amber-200">כניסת מנהל</h2>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div className="rounded-lg bg-amber-950/30 border border-amber-800/50 p-3">
            <div className="text-xs text-amber-400 mb-1">המערכת תזהה אותך כמנהל</div>
            <div className="text-base font-bold text-amber-200">{currentUser}</div>
          </div>
          <div>
            <label className="block text-xs text-stone-400 mb-1">סיסמת מנהל</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white focus:border-amber-600 focus:outline-none" />
          </div>
          {error && <div className="text-xs text-rose-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</div>}
          <button onClick={handleSubmit}
            className="w-full rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 px-4 py-3 font-bold text-white hover:from-amber-500 hover:to-amber-600 transition">
            הפוך למנהל
          </button>
          <div className="text-xs text-stone-500 text-center">תיזכר במכשיר הזה</div>
        </div>
      </div>
    </div>
  );
};

// ===== Tooltip =====
const InfoTooltip = ({ text }) => {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
        className="text-stone-500 hover:text-amber-400 transition align-middle">
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-64 rounded-lg border border-stone-700 bg-stone-900 p-3 text-xs text-stone-300 shadow-2xl z-50 normal-case font-normal" style={{ direction: 'rtl', letterSpacing: 'normal' }}>
          {text}
          <div className="absolute -bottom-1 right-3 h-2 w-2 rotate-45 bg-stone-900 border-b border-l border-stone-700" />
        </div>
      )}
    </span>
  );
};

// ===== פודיום =====
const PodiumCard = ({ rank, player }) => {
  const rankBorders = ['border-amber-500/60', 'border-stone-400/50', 'border-orange-600/50'];
  const rankGlow = ['shadow-amber-900/40', 'shadow-stone-700/30', 'shadow-orange-900/40'];
  const rankIcons = ['👑', '🥈', '🥉'];
  return (
    <div className={`relative rounded-2xl border-2 ${rankBorders[rank - 1]} bg-gradient-to-br from-stone-900 to-stone-950 p-5 shadow-2xl ${rankGlow[rank - 1]}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-stone-500">מקום {rank}</div>
          <div className="mt-1 text-3xl font-extrabold text-white">{player.name}</div>
        </div>
        <div className="text-5xl">{rankIcons[rank - 1]}</div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className={`text-4xl font-extrabold tabular-nums ${player.total >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {player.total >= 0 ? '+' : ''}{player.total}
        </span>
        <span className="text-stone-500 text-sm">₪</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-stone-900/80 border border-stone-800 p-2 text-center">
          <div className="text-stone-500">מפגשים</div>
          <div className="font-bold text-stone-100">{player.sessions}</div>
        </div>
        <div className="rounded-lg bg-stone-900/80 border border-stone-800 p-2 text-center">
          <div className="text-stone-500">% ניצחון</div>
          <div className="font-bold text-emerald-400">{player.winRate.toFixed(0)}%</div>
        </div>
        <div className="rounded-lg bg-stone-900/80 border border-stone-800 p-2 text-center">
          <div className="text-stone-500">רצף מנצח</div>
          <div className="font-bold text-amber-400">{player.maxStreak}</div>
        </div>
      </div>
    </div>
  );
};

// ===== סטטיסטיקות מיוחדות =====
const SpecialStats = ({ stats }) => {
  const mvp = stats[0];
  const worst = stats[stats.length - 1];
  const mostConsistent = [...stats].filter(s => s.sessions >= 5).sort((a, b) => a.stdDev - b.stdDev)[0];
  const mostVolatile = [...stats].filter(s => s.sessions >= 5).sort((a, b) => b.stdDev - a.stdDev)[0];
  const bestStreak = [...stats].sort((a, b) => b.maxStreak - a.maxStreak)[0];
  const mostActive = [...stats].sort((a, b) => b.sessions - a.sessions)[0];

  const cards = [
    { icon: Crown, label: 'המוביל בטבלה', name: mvp?.name, value: `${mvp?.total >= 0 ? '+' : ''}${mvp?.total} ₪`,
      color: 'from-amber-900/30 to-yellow-900/30 border-amber-700/50 text-amber-300',
      tooltip: 'השחקן עם הרווח המצטבר הגבוה ביותר בעונה.' },
    { icon: Skull, label: 'התחתון בטבלה', name: worst?.name, value: `${worst?.total} ₪`,
      color: 'from-rose-900/30 to-red-900/30 border-rose-700/50 text-rose-300',
      tooltip: 'השחקן עם ההפסד המצטבר הגבוה ביותר בעונה.' },
    { icon: Target, label: 'השחקן היציב ביותר', name: mostConsistent?.name, value: `סטיית תקן: ${mostConsistent?.stdDev.toFixed(0)}`,
      color: 'from-blue-900/30 to-indigo-900/30 border-blue-700/50 text-blue-300',
      tooltip: 'סטיית תקן נמוכה = התוצאות שלו במפגשים דומות זו לזו. אין לו "ערבים גדולים" או "מפולות". משחק ממוצע עקבי. (מינימום 5 מפגשים)' },
    { icon: Flame, label: 'השחקן התנודתי ביותר', name: mostVolatile?.name, value: `סטיית תקן: ${mostVolatile?.stdDev.toFixed(0)}`,
      color: 'from-orange-900/30 to-red-900/30 border-orange-700/50 text-orange-300',
      tooltip: 'סטיית תקן גבוהה = התוצאות שלו במפגשים קיצוניות. ערב אחד ניצחון גדול, הבא הפסד גדול. (מינימום 5 מפגשים)' },
    { icon: TrendingUp, label: 'הרצף המנצח הארוך', name: bestStreak?.name, value: `${bestStreak?.maxStreak} ערבים ברצף`,
      color: 'from-emerald-900/30 to-green-900/30 border-emerald-700/50 text-emerald-300',
      tooltip: 'מספר הערבים המקסימלי ברצף שהשחקן סיים ברווח (ללא הפסד באמצע).' },
    { icon: Users, label: 'הנוכחות הגבוהה ביותר', name: mostActive?.name, value: `${mostActive?.sessions} מפגשים`,
      color: 'from-violet-900/30 to-purple-900/30 border-violet-700/50 text-violet-300',
      tooltip: 'השחקן שהגיע לכמות הגדולה ביותר של מפגשים בעונה.' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div key={i} className={`rounded-2xl border bg-gradient-to-br ${c.color} p-4 backdrop-blur`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs opacity-90">
                <Icon className="h-4 w-4" />
                {c.label}
              </div>
              <InfoTooltip text={c.tooltip} />
            </div>
            <div className="text-lg font-extrabold">{c.name || '—'}</div>
            <div className="text-sm tabular-nums opacity-80 mt-0.5">{c.value}</div>
          </div>
        );
      })}
    </div>
  );
};
// ===== בורר שחקנים =====
const PlayerPicker = ({ allPlayers, selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const toggle = (name) => {
    if (selected.includes(name)) onChange(selected.filter(n => n !== name));
    else onChange([...selected, name]);
  };
  
  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-200 hover:bg-stone-800 transition">
        <Filter className="h-4 w-4" />
        <span>{selected.length} שחקנים</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md max-h-[85vh] flex flex-col rounded-2xl border border-stone-700 bg-stone-900 shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-800 px-4 py-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-amber-400" />
                <h3 className="text-base font-bold text-amber-200">בחר שחקנים</h3>
                <span className="text-xs text-stone-500">({selected.length} נבחרו)</span>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-full p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* כפתורי בחירה מהירה */}
            <div className="border-b border-stone-800 p-3 flex gap-1.5 flex-wrap">
              <button onClick={() => onChange(allPlayers.map(p => p.name))} className="text-xs rounded-md bg-stone-800 px-3 py-1.5 text-stone-300 hover:bg-stone-700 font-bold">הכל</button>
              <button onClick={() => onChange(allPlayers.slice(0, 3).map(p => p.name))} className="text-xs rounded-md bg-amber-900/40 px-3 py-1.5 text-amber-300 hover:bg-amber-900/60 font-bold">טופ 3</button>
              <button onClick={() => onChange(allPlayers.slice(0, 5).map(p => p.name))} className="text-xs rounded-md bg-amber-900/40 px-3 py-1.5 text-amber-300 hover:bg-amber-900/60 font-bold">טופ 5</button>
              <button onClick={() => onChange(allPlayers.slice(0, 8).map(p => p.name))} className="text-xs rounded-md bg-amber-900/40 px-3 py-1.5 text-amber-300 hover:bg-amber-900/60 font-bold">טופ 8</button>
              <button onClick={() => onChange([])} className="text-xs rounded-md bg-stone-800 px-3 py-1.5 text-stone-300 hover:bg-stone-700 font-bold">ניקוי</button>
            </div>
            
            {/* רשימת שחקנים */}
            <div className="overflow-y-auto p-2 flex-1">
              {allPlayers.map(p => {
                const isSelected = selected.includes(p.name);
                return (
                  <label key={p.name} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition ${isSelected ? 'bg-amber-950/30 hover:bg-amber-950/50' : 'hover:bg-stone-800'}`}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggle(p.name)}
                      className="w-4 h-4 rounded border-stone-600 bg-stone-800 text-amber-500 focus:ring-amber-500 flex-shrink-0" />
                    <span className="text-sm text-stone-100 font-bold flex-1 text-right">{p.name}</span>
                    <span className={`text-xs tabular-nums font-bold flex-shrink-0 ${p.total >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {p.total >= 0 ? '+' : ''}{p.total}
                    </span>
                  </label>
                );
              })}
            </div>
            
            {/* כפתור סגירה */}
            <div className="border-t border-stone-800 p-3">
              <button onClick={() => setOpen(false)}
                className="w-full rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 py-2.5 font-bold text-white hover:from-amber-500 hover:to-amber-600 transition">
                סיום ({selected.length} נבחרו)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ===== גרף רווח מצטבר =====
const CumulativeChart = ({ sessions, stats, fullscreen, onFullscreenToggle, selectedPlayers, onPlayersChange, isMobile }) => {
  const data = useMemo(() => calculateCumulative(sessions, selectedPlayers), [sessions, selectedPlayers]);
  const colors = ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c', '#2dd4bf', '#f87171', '#c084fc', '#facc15', '#4ade80', '#38bdf8', '#fb7185', '#818cf8', '#f59e0b'];
  
  // במובייל - פחות שחקנים כברירת מחדל אם יותר מדי
  const chartHeight = fullscreen ? 'calc(100vh - 180px)' : (isMobile ? 280 : 400);

  return (
    <div className={`rounded-2xl border border-stone-800 bg-stone-950/50 p-4 md:p-6 backdrop-blur ${fullscreen ? 'h-full' : ''}`}>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg md:text-xl font-bold text-amber-200 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            רווח מצטבר לאורך זמן
          </h3>
          <InfoTooltip text="הציר האופקי: תאריכי המפגשים. הציר האנכי: הרווח המצטבר של השחקן. קו עולה = צובר רווחים. קו יורד = צובר הפסדים." />
        </div>
        <div className="flex items-center gap-2">
          <PlayerPicker allPlayers={stats} selected={selectedPlayers} onChange={onPlayersChange} />
          <button onClick={onFullscreenToggle}
            className="rounded-lg border border-stone-700 bg-stone-900 p-2 text-stone-300 hover:bg-stone-800 transition" title={fullscreen ? 'חזור' : 'מסך מלא'}>
            {fullscreen ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div style={{ width: '100%', height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: isMobile ? 40 : 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
            <XAxis dataKey="label" stroke="#78716c" style={{ fontSize: isMobile ? '10px' : '11px' }} 
              angle={isMobile ? -45 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 50 : 30} />
            <YAxis stroke="#78716c" style={{ fontSize: isMobile ? '10px' : '11px' }} width={40} />
            <Tooltip contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #44403c', borderRadius: '8px', fontFamily: 'Assistant', fontSize: '12px' }} labelStyle={{ color: '#fbbf24' }} />
            {!isMobile && <Legend wrapperStyle={{ fontSize: '12px', fontFamily: 'Assistant' }} />}
            {selectedPlayers.map((name, i) => (
              <Line key={name} type="monotone" dataKey={name} stroke={colors[i % colors.length]} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* לגנדה ידנית במובייל - מתחת לגרף */}
      {isMobile && selectedPlayers.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 justify-center text-xs">
          {selectedPlayers.map((name, i) => (
            <div key={name} className="flex items-center gap-1.5 bg-stone-900/60 rounded-full px-2.5 py-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
              <span className="text-stone-300">{name}</span>
            </div>
          ))}
        </div>
      )}
      {selectedPlayers.length === 0 && (
        <div className="text-center text-stone-500 text-sm py-8">בחר שחקנים להצגה בגרף</div>
      )}
    </div>
  );
};

// ===== טבלה ראשית =====
const MainLeaderboard = ({ stats, sessions }) => {
  const latestDate = getLatestSessionDate(sessions);
  const columns = [
    { key: 'total', label: 'רווח' },
    { key: 'sessions', label: 'מפגשים' },
    { key: 'avg', label: 'ממוצע לערב' },
    { key: 'wins', label: 'ניצחונות' },
    { key: 'losses', label: 'הפסדים' },
    { key: 'ties', label: 'תיקו' },
    { key: 'winRate', label: '% ניצחון' },
    { key: 'maxStreak', label: 'רצף מנצח' },
    { key: 'biggestWin', label: 'שיא רווח' },
    { key: 'biggestLoss', label: 'שיא הפסד' },
    { key: 'stdDev', label: 'סטיית תקן', tooltip: 'מדד לתנודתיות. נמוך=יציב, גבוה=תוצאות קיצוניות.' },
  ];
  const fmt = (v, key) => {
    if (v === undefined || v === null) return '—';
    if (key === 'total') return `${v >= 0 ? '+' : ''}${v}`;
    if (key === 'avg') return v.toFixed(1);
    if (key === 'winRate') return `${v.toFixed(0)}%`;
    if (key === 'biggestWin') return `+${v}`;
    if (key === 'stdDev') return v.toFixed(0);
    return v;
  };
  const color = (v, key) => {
    if (key === 'total' || key === 'avg') return v > 0 ? 'text-emerald-400 font-extrabold' : v < 0 ? 'text-rose-400 font-extrabold' : 'text-stone-400';
    if (key === 'wins' || key === 'biggestWin' || key === 'winRate') return 'text-emerald-400';
    if (key === 'losses' || key === 'biggestLoss') return 'text-rose-400';
    if (key === 'maxStreak') return 'text-amber-400';
    if (key === 'stdDev') return 'text-stone-500';
    return 'text-stone-300';
  };

  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950/50 backdrop-blur">
      <div className="border-b border-stone-800 bg-gradient-to-r from-amber-950/40 to-stone-900/40 px-4 md:px-6 py-4 flex items-center justify-between flex-wrap gap-2 rounded-t-2xl">
        <h3 className="text-lg md:text-xl font-bold text-amber-200 flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          טבלת דירוג ראשית
        </h3>
        {latestDate && (
          <div className="text-xs text-stone-400">
            מעודכן עד: <span className="text-amber-300 font-bold">{new Date(latestDate).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
          </div>
        )}
      </div>
      <div className="relative overflow-auto rounded-b-2xl" dir="rtl" style={{ maxHeight: '70vh', WebkitOverflowScrolling: 'touch' }}>
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-40">
            <tr>
              <th className="sticky top-0 right-0 z-50 bg-stone-900 border-b-2 border-l border-stone-700 px-3 py-3 text-right font-bold text-xs text-amber-200 uppercase tracking-wider min-w-[55px] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]">#</th>
              <th className="sticky top-0 z-50 bg-stone-900 border-b-2 border-l border-stone-700 px-3 py-3 text-right font-bold text-xs text-amber-200 uppercase tracking-wider min-w-[90px] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]" style={{ right: '55px' }}>שחקן</th>
              {columns.map(c => (
                <th key={c.key} className="sticky top-0 z-40 bg-stone-900 border-b-2 border-stone-700 px-3 py-3 text-right font-bold text-xs text-amber-200 uppercase tracking-wider whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">{c.label}{c.tooltip && <InfoTooltip text={c.tooltip} />}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.map((p, i) => {
              const rowBg = i % 2 === 0 ? 'bg-stone-950' : 'bg-stone-900/50';
              return (
                <tr key={p.name} className="group hover:bg-amber-950/10">
                  <td className={`sticky right-0 z-20 ${rowBg} group-hover:bg-amber-950/20 border-b border-l border-stone-800 px-3 py-3 font-bold text-stone-500 tabular-nums whitespace-nowrap shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]`}>
                    {i + 1}{i < 3 && <span className="mr-1">{['🥇','🥈','🥉'][i]}</span>}
                  </td>
                  <td className={`sticky z-20 ${rowBg} group-hover:bg-amber-950/20 border-b border-l border-stone-800 px-3 py-3 font-bold text-stone-100 whitespace-nowrap shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]`} style={{ right: '55px' }}>
                    {p.name}
                  </td>
                  {columns.map(c => (
                    <td key={c.key} className={`border-b border-stone-900 px-3 py-3 tabular-nums whitespace-nowrap ${color(p[c.key], c.key)}`}>
                      {fmt(p[c.key], c.key)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
// ===== מודל הוספת ערב =====
const AddSessionModal = ({ isOpen, onClose, onSave, players, currentSeason, adminName }) => {
  const [step, setStep] = useState('upload');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [results, setResults] = useState([]);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [host, setHost] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const reset = () => {
    setStep('upload'); setImage(null); setImagePreview(null); setParsing(false);
    setResults([]); setHost(''); setError('');
  };
  const handleClose = () => { reset(); onClose(); };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setImage(ev.target.result); setImagePreview(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const parseImage = async () => {
    if (!image) return;
    setParsing(true); setError('');
    try {
      const base64Data = image.split(',')[1];
      const mediaType = image.split(';')[0].split(':')[1];
      const playersListStr = players.join(', ');
      const prompt = `אתה מנתח צילום של טבלת סיכום ערב פוקר בעברית.
רשימת השחקנים: ${playersListStr}
כל שחקן מופיע בשורה עם כמה סכומי ביניים שמסתכמים לסכום סופי.
אל תכלול קופה או ערכי ביניים.
החזר JSON בלבד: {"players":[{"name":"שם","amount":סכום}]}`;
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } },
            { type: "text", text: prompt }
          ] }]
        })
      });
      const data = await response.json();
      const text = data.content.map(c => c.text || '').join('').replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(text);
      setResults(parsed.players.map(p => ({ name: p.name, amount: Number(p.amount) || 0 })));
      setStep('confirm');
    } catch (e) {
      console.error(e);
      setError('לא הצלחתי לקרוא את התמונה. נסה תמונה ברורה יותר, או הכנס ידנית.');
      setStep('manual');
      setResults(players.map(p => ({ name: p, amount: 0 })));
    } finally { setParsing(false); }
  };

  const handleManualEntry = () => {
    setStep('manual');
    setResults(players.map(p => ({ name: p, amount: 0 })));
  };

  const updateResult = (idx, field, value) => {
    const updated = [...results];
    if (field === 'amount') updated[idx].amount = value === '' ? '' : Number(value);
    else updated[idx][field] = value;
    setResults(updated);
  };
  const addPlayerRow = () => setResults([...results, { name: players[0], amount: 0 }]);
  const removeRow = (idx) => setResults(results.filter((_, i) => i !== idx));

  const handleSave = () => {
    const validResults = results.filter(r => r.name && r.amount !== '' && r.amount !== 0);
    const resultsObj = {};
    validResults.forEach(r => { resultsObj[r.name] = (resultsObj[r.name] || 0) + Number(r.amount); });
    const pot = Object.values(resultsObj).filter(v => v > 0).reduce((a, b) => a + b, 0);
    onSave({ date: sessionDate, season: currentSeason, pot, results: resultsObj, host: host || undefined, addedBy: adminName, addedAt: new Date().toISOString() });
    reset(); onClose();
  };

  if (!isOpen) return null;
  const total = results.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={handleClose}>
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-amber-900/50 bg-stone-950 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-800 bg-stone-950/95 px-6 py-4 backdrop-blur">
          <h2 className="text-xl md:text-2xl font-bold text-amber-200">
            ערב חדש — {step === 'upload' ? 'העלאת תמונה' : step === 'confirm' ? 'אישור תוצאות' : 'הכנסה ידנית'}
          </h2>
          <button onClick={handleClose} className="rounded-full p-2 text-stone-400 hover:bg-stone-800 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6">
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-stone-400 mb-1">תאריך</label>
                  <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)}
                    className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-xs text-stone-400 mb-1">מארח</label>
                  <select value={host} onChange={e => setHost(e.target.value)}
                    className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white">
                    <option value="">בחר...</option>
                    {players.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              {!imagePreview ? (
                <div onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-stone-700 bg-stone-900/50 p-12 cursor-pointer hover:border-amber-600/50 hover:bg-stone-900 transition group">
                  <Upload className="h-12 w-12 text-stone-600 group-hover:text-amber-400" />
                  <div className="text-center">
                    <div className="text-lg font-bold text-stone-200">העלה צילום של סיום הערב</div>
                    <div className="text-sm text-stone-500 mt-1">תמונה של הדף עם הסכומים</div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                </div>
              ) : (
                <div className="space-y-3">
                  <img src={imagePreview} alt="preview" className="max-h-96 mx-auto rounded-xl border border-stone-700" />
                  <div className="flex gap-3">
                    <button onClick={() => { setImage(null); setImagePreview(null); }}
                      className="flex-1 rounded-lg border border-stone-700 bg-stone-900 px-4 py-2 text-stone-300 hover:bg-stone-800">
                      תמונה אחרת
                    </button>
                    <button onClick={parseImage} disabled={parsing}
                      className="flex-1 rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 px-4 py-2 font-bold text-white hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 flex items-center justify-center gap-2">
                      {parsing ? <><Loader2 className="h-4 w-4 animate-spin" /> מזהה...</> : 'זהה תוצאות'}
                    </button>
                  </div>
                </div>
              )}
              {error && (
                <div className="flex gap-2 rounded-lg border border-rose-900/50 bg-rose-950/30 p-3 text-sm text-rose-300">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" /><div>{error}</div>
                </div>
              )}
              <button onClick={handleManualEntry} className="w-full rounded-lg border border-stone-700 bg-stone-900 py-3 text-stone-300 hover:bg-stone-800 text-sm">
                או — הכנס ידנית ללא תמונה
              </button>
            </div>
          )}
          {(step === 'confirm' || step === 'manual') && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-stone-400 mb-1">תאריך</label>
                  <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)}
                    className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-xs text-stone-400 mb-1">מארח</label>
                  <select value={host} onChange={e => setHost(e.target.value)}
                    className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white">
                    <option value="">בחר...</option>
                    {players.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="rounded-xl border border-stone-800 bg-stone-900/50">
                <div className="flex items-center justify-between border-b border-stone-800 px-4 py-3">
                  <div className="text-sm font-bold text-stone-300">
                    תוצאות ({results.filter(r => r.amount !== 0 && r.amount !== '').length} פעילים)
                  </div>
                  <div className={`text-xs tabular-nums ${Math.abs(total) < 0.01 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    סה"כ: {total >= 0 ? '+' : ''}{total}
                    {Math.abs(total) > 0.01 && <span className="mr-1">⚠ לא מאוזן</span>}
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto p-3 space-y-2">
                  {results.map((r, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select value={r.name} onChange={e => updateResult(idx, 'name', e.target.value)}
                        className="flex-1 rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-white text-sm">
                        {players.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <input type="number" value={r.amount} onChange={e => updateResult(idx, 'amount', e.target.value)}
                        placeholder="סכום"
                        className={`w-28 rounded-lg border bg-stone-800 px-3 py-2 text-sm tabular-nums ${
                          Number(r.amount) > 0 ? 'border-emerald-800 text-emerald-300' :
                          Number(r.amount) < 0 ? 'border-rose-800 text-rose-300' : 'border-stone-700 text-stone-400'
                        }`} />
                      <button onClick={() => removeRow(idx)} className="rounded-lg border border-stone-700 bg-stone-800 p-2 text-stone-400 hover:bg-rose-950 hover:text-rose-300">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="border-t border-stone-800 p-3">
                  <button onClick={addPlayerRow} className="w-full rounded-lg border border-stone-700 bg-stone-800 py-2 text-sm text-stone-300 hover:bg-stone-700 flex items-center justify-center gap-2">
                    <Plus className="h-4 w-4" /> הוסף שחקן
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep('upload')}
                  className="flex-1 rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-stone-300 hover:bg-stone-800">
                  חזור
                </button>
                <button onClick={handleSave}
                  className="flex-1 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-3 font-bold text-white hover:from-emerald-500 hover:to-emerald-600 flex items-center justify-center gap-2">
                  <Check className="h-4 w-4" /> שמור ערב
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ===== היסטוריה =====
const SessionHistory = ({ sessions, onDelete, isAdmin }) => {
  const sorted = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950/50 backdrop-blur">
      <div className="border-b border-stone-800 bg-gradient-to-r from-amber-950/40 to-stone-900/40 px-6 py-4">
        <h3 className="text-xl font-bold text-amber-200 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          היסטוריית מפגשים ({sessions.length})
        </h3>
      </div>
      <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
        {sorted.map((s, i) => {
          const winners = Object.entries(s.results).filter(([_, v]) => v > 0).sort((a, b) => b[1] - a[1]);
          const losers = Object.entries(s.results).filter(([_, v]) => v < 0).sort((a, b) => a[1] - b[1]);
          const winner = winners[0]; const loser = losers[0];
          return (
            <div key={i} className="border-b border-stone-900 p-4 hover:bg-stone-900/30 transition">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-sm font-bold text-stone-100">
                    {new Date(s.date).toLocaleDateString('he-IL', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  {s.host && <div className="text-xs text-stone-500">מארח: <span className="text-amber-400">{s.host}</span></div>}
                  <div className="text-xs text-stone-500">קופה: <span className="text-stone-300 tabular-nums">{s.pot}</span></div>
                  <div className="text-xs text-stone-600">{Object.keys(s.results).length} שחקנים</div>
                  {s.addedBy && <div className="text-xs text-stone-600">הוסף ע"י: <span className="text-violet-400">{s.addedBy}</span></div>}
                </div>
                {isAdmin && onDelete && (
                  <button onClick={() => { if (confirm('למחוק את המפגש?')) onDelete(s.date); }} className="text-stone-600 hover:text-rose-400 p-1">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="text-xs text-stone-400 flex gap-4 flex-wrap">
                {winner && <span>🏆 <span className="text-amber-300 font-bold">{winner[0]}</span> <span className="text-emerald-400 tabular-nums">+{winner[1]}</span></span>}
                {loser && <span>💀 <span className="text-rose-300 font-bold">{loser[0]}</span> <span className="text-rose-400 tabular-nums">{loser[1]}</span></span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ===== סקשן ציטוטים =====
const QuotesSection = ({ deletedIds, likes, userQuotes, currentUser, players, onDelete, onLike, onAddQuote, isAdmin }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterQuoted, setFilterQuoted] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // newest | likes
  const [addModalOpen, setAddModalOpen] = useState(false);

  // שילוב הציטוטים ההיסטוריים עם ציטוטי המשתמשים
  const combinedQuotes = useMemo(() => {
    return [...ALL_QUOTES, ...(userQuotes || [])];
  }, [userQuotes]);

  // רשימת כל המצוטטים (לפילטר)
  const allQuoted = useMemo(() => {
    const s = new Set(combinedQuotes.map(q => q.quoted));
    return Array.from(s).sort();
  }, [combinedQuotes]);

  // ציטוטים מסוננים
  const visibleQuotes = useMemo(() => {
    let list = combinedQuotes.filter(q => !deletedIds.includes(q.id));
    
    // סינון לפי מצוטט
    if (filterQuoted !== 'all') {
      list = list.filter(q => q.quoted === filterQuoted);
    }
    
    // חיפוש
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(quote => 
        quote.text.toLowerCase().includes(q) ||
        quote.quoted.toLowerCase().includes(q) ||
        quote.quoter.toLowerCase().includes(q)
      );
    }
    
    // מיון
    if (sortBy === 'likes') {
      list = [...list].sort((a, b) => (likes[b.id] || 0) - (likes[a.id] || 0));
    } else {
      // newest first - ציטוטי משתמשים חדשים (עם createdAt) קודם, אחר כך לפי תאריך הודעה
      list = [...list].sort((a, b) => {
        // אם יש createdAt - זה ציטוט חדש, קודם
        if (a.createdAt && b.createdAt) return new Date(b.createdAt) - new Date(a.createdAt);
        if (a.createdAt) return -1;
        if (b.createdAt) return 1;
        const da = parseHebrewDate(a.date);
        const db = parseHebrewDate(b.date);
        return db - da;
      });
    }
    
    return list;
  }, [combinedQuotes, deletedIds, likes, filterQuoted, searchQuery, sortBy]);

  const totalQuotes = combinedQuotes.length - deletedIds.length;

  return (
    <div className="space-y-4">
      {/* Header + פילטרים */}
      <div className="rounded-2xl border border-stone-800 bg-stone-950/50 backdrop-blur p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h3 className="text-lg md:text-xl font-bold text-amber-200 flex items-center gap-2">
            <Quote className="h-5 w-5" />
            ציטוטים אגדיים ({visibleQuotes.length} / {totalQuotes})
          </h3>
          <button onClick={() => setAddModalOpen(true)}
            className="rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 px-4 py-2 text-sm font-bold text-white hover:from-amber-500 hover:to-amber-600 shadow-lg shadow-amber-900/40 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            הוסף ציטוט
          </button>
        </div>
        
        {/* חיפוש */}
        <div className="relative mb-3">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="חפש ציטוט, שחקן או מילה..."
            className="w-full rounded-lg border border-stone-700 bg-stone-900 pr-10 pl-4 py-2.5 text-white text-sm focus:border-amber-600 focus:outline-none" />
        </div>
        
        {/* פילטרים */}
        <div className="flex flex-wrap gap-2">
          <select value={filterQuoted} onChange={e => setFilterQuoted(e.target.value)}
            className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-white">
            <option value="all">כל השחקנים</option>
            {allQuoted.map(name => (
              <option key={name} value={name}>ציטוטים של {name}</option>
            ))}
          </select>
          <div className="flex rounded-lg border border-stone-700 bg-stone-900 p-1">
            <button onClick={() => setSortBy('newest')}
              className={`px-3 py-1 text-xs rounded-md font-bold transition ${sortBy === 'newest' ? 'bg-amber-700 text-white' : 'text-stone-400 hover:text-stone-200'}`}>
              מהחדש לישן
            </button>
            <button onClick={() => setSortBy('likes')}
              className={`px-3 py-1 text-xs rounded-md font-bold transition ${sortBy === 'likes' ? 'bg-amber-700 text-white' : 'text-stone-400 hover:text-stone-200'}`}>
              הכי אהובים
            </button>
          </div>
          {(filterQuoted !== 'all' || searchQuery || sortBy !== 'newest') && (
            <button onClick={() => { setFilterQuoted('all'); setSearchQuery(''); setSortBy('newest'); }}
              className="text-xs text-stone-500 hover:text-amber-300 px-2">איפוס פילטרים</button>
          )}
        </div>
      </div>

      {/* רשימת ציטוטים */}
      <div className="space-y-3">
        {visibleQuotes.length === 0 && (
          <div className="text-center py-12 text-stone-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <div>אין ציטוטים שעונים לפילטרים האלה</div>
          </div>
        )}
        {visibleQuotes.map(q => (
          <QuoteCard key={q.id} quote={q}
            likeCount={likes[q.id] || 0}
            onLike={() => onLike(q.id)}
            onDelete={isAdmin ? () => onDelete(q.id) : null} />
        ))}
      </div>

      {/* מודל הוספת ציטוט */}
      <AddQuoteModal 
        isOpen={addModalOpen} 
        onClose={() => setAddModalOpen(false)}
        currentUser={currentUser}
        players={players}
        onSave={onAddQuote} />
    </div>
  );
};

// ===== מודל הוספת ציטוט חדש =====
const AddQuoteModal = ({ isOpen, onClose, currentUser, players, onSave }) => {
  const [quoted, setQuoted] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setError('');
    
    // ולידציה
    if (!quoted) {
      setError('חובה לבחור מי אמר את הציטוט');
      return;
    }
    if (!text.trim()) {
      setError('חובה להקליד את הציטוט');
      return;
    }
    if (quoted === currentUser) {
      setError('אי אפשר לצטט את עצמך 😉 (אם מישהו אחר שמע אותך - תן לו להוסיף)');
      return;
    }
    if (text.trim().length < 3) {
      setError('ציטוט קצרצר... תוסיף עוד קצת תוכן');
      return;
    }

    setSaving(true);
    const now = new Date();
    const newQuote = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      quoted,
      quoter: currentUser,
      text: text.trim(),
      date: now.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.'),
      createdAt: now.toISOString(),
      isUserAdded: true
    };
    
    await onSave(newQuote);
    
    // איפוס וסגירה
    setQuoted('');
    setText('');
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl border-2 border-amber-700/50 bg-gradient-to-br from-stone-900 to-stone-950 p-5 shadow-2xl" 
        onClick={e => e.stopPropagation()} dir="rtl">
        
        {/* כותרת */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Quote className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-extrabold text-amber-200">הוסף ציטוט חדש</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="text-xs text-stone-400 mb-4 bg-stone-900/50 border border-stone-800 rounded-lg px-3 py-2">
          💡 שמעת משהו מצחיק בשולחן? הקלט אותו לדורות הבאים!
        </div>

        {/* מי אמר */}
        <div className="mb-4">
          <label className="block text-xs text-stone-400 font-bold mb-1.5">מי אמר?</label>
          <select value={quoted} onChange={e => { setQuoted(e.target.value); setError(''); }}
            className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2.5 text-white text-sm focus:border-amber-600 focus:outline-none">
            <option value="">בחר שחקן...</option>
            {players.filter(p => p !== currentUser).map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* תוכן הציטוט */}
        <div className="mb-4">
          <label className="block text-xs text-stone-400 font-bold mb-1.5">מה הוא אמר?</label>
          <textarea value={text} onChange={e => { setText(e.target.value); setError(''); }}
            placeholder='"זרקתי דאבל אייס... זה היה חייב להיות שלי"'
            rows={3}
            maxLength={300}
            className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2.5 text-white text-sm focus:border-amber-600 focus:outline-none resize-none" />
          <div className="text-xs text-stone-500 mt-1 text-left">{text.length}/300</div>
        </div>

        {/* מי מוסיף (אוטומטי) */}
        <div className="mb-4 text-xs text-stone-400 bg-stone-900/50 border border-stone-800 rounded-lg px-3 py-2">
          המצטט: <span className="font-bold text-amber-300">{currentUser}</span>
        </div>

        {/* שגיאה */}
        {error && (
          <div className="mb-4 rounded-lg border border-rose-700/50 bg-rose-950/30 text-rose-300 text-sm px-3 py-2 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* כפתורים */}
        <div className="flex gap-2">
          <button onClick={onClose} disabled={saving}
            className="flex-1 rounded-lg border border-stone-700 bg-stone-900 py-2.5 text-sm font-bold text-stone-300 hover:bg-stone-800">
            ביטול
          </button>
          <button onClick={handleSave} disabled={saving || !quoted || !text.trim()}
            className="flex-1 rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 py-2.5 text-sm font-bold text-white hover:from-amber-500 hover:to-amber-600 shadow-lg shadow-amber-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {saving ? 'שומר...' : 'הוסף ציטוט'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== כרטיס ציטוט בודד =====
const QuoteCard = ({ quote, likeCount, onLike, onDelete }) => {
  const [liked, setLiked] = useState(false);
  
  const handleLike = () => {
    if (!liked) {
      onLike();
      setLiked(true);
    }
  };

  return (
    <div className="group rounded-xl border border-stone-800 bg-gradient-to-br from-stone-900/80 to-stone-950/80 p-4 md:p-5 backdrop-blur hover:border-amber-900/50 transition">
      {/* הציטוט עצמו */}
      <div className="flex gap-3 mb-3">
        <Quote className="h-5 w-5 text-amber-600/60 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-stone-100 text-base md:text-lg leading-relaxed">
          "{quote.text}"
        </div>
      </div>
      
      {/* שורה תחתונה: מצוטט + תאריך + מצטט + פעולות */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-3 border-t border-stone-800">
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <span className="text-amber-400 font-bold">— {quote.quoted}</span>
          <span className="text-stone-600">•</span>
          <span className="text-stone-500">{quote.date}</span>
          <span className="text-stone-600">•</span>
          <span className="text-stone-500">מצוטט ע״י {quote.quoter}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleLike}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
              liked ? 'bg-rose-900/30 text-rose-300 border border-rose-800/50' : 'bg-stone-800/80 text-stone-400 hover:bg-rose-900/20 hover:text-rose-300 border border-stone-700'
            }`}>
            <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-current' : ''}`} />
            {likeCount}
          </button>
          {onDelete && (
            <button onClick={() => { if (confirm('למחוק את הציטוט לצמיתות?')) onDelete(); }}
              className="rounded-full p-1.5 text-stone-600 hover:text-rose-400 hover:bg-stone-800 transition" title="מחק (מנהלים)">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
// ===== מסך בחירת שם משתמש =====
const UserSelectScreen = ({ players, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredPlayers = useMemo(() => {
    if (!searchTerm) return players;
    return players.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [players, searchTerm]);

  return (
    <div dir="rtl" className="min-h-screen bg-stone-950 flex items-center justify-center p-4 relative overflow-hidden" style={{ fontFamily: 'Assistant, sans-serif' }}>
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, #0f5132 0%, #052e16 50%, #000 100%)',
      }} />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-900/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-red-900/20 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">♠</div>
          <h2 className="text-3xl font-extrabold text-amber-200 mb-2">מי אתה?</h2>
          <p className="text-stone-400 text-sm">בחר את שמך מהרשימה</p>
        </div>

        <div className="rounded-2xl border border-amber-900/50 bg-stone-950/90 backdrop-blur shadow-2xl">
          <div className="border-b border-stone-800 p-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus
                placeholder="חפש את שמך..."
                className="w-full rounded-lg border border-stone-700 bg-stone-900 pr-10 pl-4 py-2.5 text-white text-sm focus:border-amber-600 focus:outline-none" />
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {filteredPlayers.map(name => (
              <button key={name} onClick={() => onSelect(name)}
                className="w-full text-right rounded-lg px-4 py-3 hover:bg-amber-950/30 transition flex items-center justify-between group">
                <span className="text-stone-100 font-bold text-base">{name}</span>
                <span className="text-stone-600 group-hover:text-amber-400 text-sm">→</span>
              </button>
            ))}
            {filteredPlayers.length === 0 && (
              <div className="text-center py-8 text-stone-500 text-sm">אין שחקנים שמתאימים לחיפוש</div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-stone-500">
          הבחירה תיזכר בדפדפן הזה. תוכל להחליף בכל זמן מהראש של האפליקציה.
        </div>
      </div>
    </div>
  );
};

// ===== כרטיסי תובנות אישיות =====
const PersonalInsights = ({ playerName, sessions, stats, hostingSchedule }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef(null);
  
  const myStats = stats.find(s => s.name === playerName);
  if (!myStats) {
    return (
      <div className="rounded-2xl border border-amber-900/50 bg-gradient-to-br from-amber-950/30 to-stone-900/50 p-5 backdrop-blur">
        <div className="text-amber-200 font-bold text-lg mb-2">שלום {playerName}!</div>
        <div className="text-stone-400 text-sm">עוד לא השתתפת במפגשים בעונה הזאת. ברגע שתגיע - הסטטיסטיקה שלך תופיע פה.</div>
      </div>
    );
  }

  const myRank = stats.findIndex(s => s.name === playerName) + 1;
  
  // המארח האהוב עליי
  const hostStats = {};
  sessions.forEach(s => {
    if (s.host && s.results[playerName] !== undefined) {
      if (!hostStats[s.host]) hostStats[s.host] = { total: 0, count: 0, wins: 0 };
      hostStats[s.host].total += s.results[playerName];
      hostStats[s.host].count++;
      if (s.results[playerName] > 0) hostStats[s.host].wins++;
    }
  });
  const favoriteHost = Object.entries(hostStats)
    .filter(([_, v]) => v.count >= 2)
    .sort((a, b) => b[1].total - a[1].total)[0];

  // האירוח הקרוב
  const today = new Date().toISOString().split('T')[0];
  const myNextHost = hostingSchedule
    .filter(h => h.date >= today && h.host === playerName)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  // בניית רשימת slides - כל אחד עם נתון אחד גדול ובולט
  const slides = [
    {
      emoji: '🏆',
      label: 'המקום שלך בדירוג',
      value: `#${myRank}`,
      valueClass: 'text-amber-300',
      sub: `מתוך ${stats.length} שחקנים בעונה`,
      bgClass: 'from-amber-900/40 to-stone-900/50',
      borderClass: 'border-amber-700/50',
    },
    {
      emoji: myStats.total >= 0 ? '💰' : '📉',
      label: 'הרווח שלך בעונה',
      value: `${myStats.total >= 0 ? '+' : ''}${myStats.total} ₪`,
      valueClass: myStats.total >= 0 ? 'text-emerald-400' : 'text-rose-400',
      sub: myStats.total >= 0 ? 'בדרך למעלה!' : 'יש עוד הרבה זמן להשתפר',
      bgClass: myStats.total >= 0 ? 'from-emerald-900/40 to-stone-900/50' : 'from-rose-900/30 to-stone-900/50',
      borderClass: myStats.total >= 0 ? 'border-emerald-700/50' : 'border-rose-700/40',
    },
    {
      emoji: '🎯',
      label: 'אחוז ניצחון',
      value: `${myStats.winRate.toFixed(0)}%`,
      valueClass: 'text-emerald-400',
      sub: `${myStats.wins} ניצחונות מתוך ${myStats.sessions} מפגשים`,
      bgClass: 'from-emerald-900/40 to-stone-900/50',
      borderClass: 'border-emerald-700/50',
    },
    {
      emoji: '🔥',
      label: 'הערב הכי טוב שלך',
      value: `+${myStats.biggestWin} ₪`,
      valueClass: 'text-amber-400',
      sub: 'השיא האישי בעונה',
      bgClass: 'from-amber-900/40 to-stone-900/50',
      borderClass: 'border-amber-700/50',
    },
    {
      emoji: '💔',
      label: 'הנפילה הכי גדולה',
      value: `${myStats.biggestLoss} ₪`,
      valueClass: 'text-rose-400',
      sub: 'הערב הכי קשה בעונה',
      bgClass: 'from-rose-900/30 to-stone-900/50',
      borderClass: 'border-rose-700/40',
    },
    {
      emoji: '⚡',
      label: 'רצף ניצחונות מקסימלי',
      value: myStats.maxStreak,
      valueClass: 'text-violet-300',
      sub: `${myStats.maxStreak === 1 ? 'ערב אחד' : `${myStats.maxStreak} ערבים`} ברצף ללא הפסד`,
      bgClass: 'from-violet-900/30 to-stone-900/50',
      borderClass: 'border-violet-700/40',
    },
  ];

  if (favoriteHost) {
    slides.push({
      emoji: '🍀',
      label: 'המארח שמביא לך מזל',
      value: `אצל ${favoriteHost[0]}`,
      valueClass: 'text-amber-300',
      sub: `${favoriteHost[1].total >= 0 ? '+' : ''}${favoriteHost[1].total} ₪ ב-${favoriteHost[1].count} מפגשים`,
      bgClass: 'from-emerald-900/40 to-stone-900/50',
      borderClass: 'border-emerald-700/50',
      isText: true,
    });
  }

  if (myNextHost) {
    slides.push({
      emoji: '🏠',
      label: 'התור הבא שלך לארח',
      value: new Date(myNextHost.date).toLocaleDateString('he-IL', { day: '2-digit', month: 'long' }),
      valueClass: 'text-emerald-300',
      sub: new Date(myNextHost.date).toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric' }),
      bgClass: 'from-emerald-900/50 to-stone-900/50',
      borderClass: 'border-emerald-700/60',
      isText: true,
    });
  }

  const goToSlide = (idx) => {
    if (scrollRef.current) {
      const slideWidth = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({ left: -idx * slideWidth, behavior: 'smooth' });
      setCurrentSlide(idx);
    }
  };

  const handleScroll = (e) => {
    const slideWidth = e.target.offsetWidth;
    const scrollLeft = Math.abs(e.target.scrollLeft);
    const newIdx = Math.round(scrollLeft / slideWidth);
    if (newIdx !== currentSlide) setCurrentSlide(newIdx);
  };

  return (
    <div className="rounded-2xl border-2 border-amber-700/50 bg-gradient-to-br from-amber-950/30 via-stone-900/40 to-stone-950/40 p-4 backdrop-blur">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-400" />
          <h3 className="text-base md:text-lg font-extrabold text-amber-200">התובנות שלך, {playerName}</h3>
        </div>
        <div className="text-xs text-amber-300/80 font-bold bg-amber-950/50 px-2 py-0.5 rounded-lg border border-amber-800/40">{currentSlide + 1}/{slides.length}</div>
      </div>

      {/* הקרוסלה עם חצים */}
      <div className="relative">
        {/* חץ ימני (חזור אחורה) */}
        {currentSlide > 0 && (
          <button 
            onClick={() => goToSlide(currentSlide - 1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-amber-900/80 hover:bg-amber-800 border border-amber-600/50 text-amber-200 w-8 h-8 flex items-center justify-center shadow-lg backdrop-blur transition"
            aria-label="הקודם">
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
        {/* חץ שמאלי (הבא) */}
        {currentSlide < slides.length - 1 && (
          <button 
            onClick={() => goToSlide(currentSlide + 1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-amber-900/80 hover:bg-amber-800 border border-amber-600/50 text-amber-200 w-8 h-8 flex items-center justify-center shadow-lg backdrop-blur transition animate-pulse-subtle"
            aria-label="הבא">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar" 
          style={{ scrollbarWidth: 'none' }}
          dir="rtl">
          {slides.map((slide, i) => (
            <div key={i} className="min-w-full snap-center px-1">
              <div className={`rounded-2xl border ${slide.borderClass} bg-gradient-to-br ${slide.bgClass} p-5 flex flex-col items-center justify-center text-center`} style={{ minHeight: '140px' }}>
                <div className="text-3xl mb-1">{slide.emoji}</div>
                <div className="text-xs text-amber-200/80 font-bold uppercase tracking-wider mb-1">{slide.label}</div>
                <div className={`${slide.isText ? 'text-xl md:text-2xl' : 'text-4xl md:text-5xl'} font-extrabold tabular-nums ${slide.valueClass} mb-1 leading-none drop-shadow-lg`}>
                  {slide.value}
                </div>
                <div className="text-xs md:text-sm text-stone-300">{slide.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* נקודות ניווט */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {slides.map((_, i) => (
          <button 
            key={i} 
            onClick={() => goToSlide(i)}
            className={`transition-all rounded-full ${
              i === currentSlide 
                ? 'w-6 h-1.5 bg-amber-400' 
                : 'w-1.5 h-1.5 bg-stone-700 hover:bg-stone-600'
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

// ===== באנר 3 המארחים הבאים בדשבורד =====
const NextHostsBanner = ({ hostingSchedule, onSeeAll }) => {
  const today = new Date().toISOString().split('T')[0];
  const upcoming = hostingSchedule
    .filter(h => h.date >= today && h.host)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  if (upcoming.length === 0) return null;

  return (
    <div className="rounded-2xl border border-stone-800 bg-gradient-to-br from-stone-900 to-stone-950 p-4 md:p-5 backdrop-blur">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-sm md:text-base font-bold text-amber-200 flex items-center gap-2">
          🏠 המארחים הבאים
        </h3>
        <button onClick={onSeeAll} className="text-xs text-amber-400 hover:text-amber-300 underline">
          ראה את כל הלוח →
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {upcoming.map((h, i) => {
          const date = new Date(h.date);
          const isFirst = i === 0;
          return (
            <div key={h.date} className={`rounded-xl border p-3 ${
              isFirst ? 'border-amber-700/50 bg-amber-950/20' : 'border-stone-800 bg-stone-900/40'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <div className={`text-xs ${isFirst ? 'text-amber-400 font-bold' : 'text-stone-500'}`}>
                  {isFirst ? 'הקרוב' : `בעוד ${i+1}`}
                </div>
                <div className="text-xs text-stone-500">{h.dayName}</div>
              </div>
              <div className="text-lg font-extrabold text-stone-100">{h.host}</div>
              <div className="text-xs text-stone-400 mt-0.5">
                {date.toLocaleDateString('he-IL', { day: '2-digit', month: 'long' })}
              </div>
              {h.notes && <div className="text-xs text-stone-500 mt-1 italic">{h.notes}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ===== טבלת ריכוז אירוחים =====
const HostingSummaryTable = ({ allSessions, players }) => {
  // ספירת אירוחים לכל שחקן לפי שנה
  const { yearCounts, years, totalCounts, sortedPlayers } = useMemo(() => {
    const byPlayerYear = {}; // {name: {year: count}}
    const years = new Set();
    
    allSessions.forEach(s => {
      if (!s.host) return;
      const year = s.season || new Date(s.date).getFullYear();
      years.add(year);
      if (!byPlayerYear[s.host]) byPlayerYear[s.host] = {};
      byPlayerYear[s.host][year] = (byPlayerYear[s.host][year] || 0) + 1;
    });
    
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    
    // חישוב סה"כ לכל שחקן
    const totals = {};
    Object.entries(byPlayerYear).forEach(([name, yrs]) => {
      totals[name] = Object.values(yrs).reduce((s, c) => s + c, 0);
    });
    
    // מיון שחקנים לפי סה"כ אירוחים (גבוה לנמוך)
    const sorted = Object.keys(byPlayerYear).sort((a, b) => totals[b] - totals[a]);
    
    return { yearCounts: byPlayerYear, years: sortedYears, totalCounts: totals, sortedPlayers: sorted };
  }, [allSessions]);
  
  if (sortedPlayers.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950/50 backdrop-blur">
      <div className="border-b border-stone-800 bg-gradient-to-r from-amber-950/40 to-stone-900/40 px-4 md:px-6 py-4 rounded-t-2xl">
        <h3 className="text-lg md:text-xl font-bold text-amber-200 flex items-center gap-2">
          🏠 סיכום אירוחים לפי שחקן
        </h3>
        <div className="text-xs text-stone-400 mt-1">מספר הפעמים שכל אחד אירח לפי שנה</div>
      </div>
      <div className="relative overflow-auto rounded-b-2xl" style={{ maxHeight: '60vh', WebkitOverflowScrolling: 'touch' }} dir="rtl">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-40">
            <tr>
              <th className="sticky top-0 right-0 z-50 bg-stone-900 border-b-2 border-l border-stone-700 px-3 py-3 text-right font-bold text-xs text-amber-200 uppercase min-w-[90px] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]">
                שחקן
              </th>
              {years.map(y => (
                <th key={y} className="sticky top-0 z-40 bg-stone-900 border-b-2 border-stone-700 px-3 py-3 text-center font-bold text-xs text-amber-200 whitespace-nowrap min-w-[70px]">
                  {y}
                </th>
              ))}
              <th className="sticky top-0 left-0 z-50 bg-amber-950/70 border-b-2 border-r border-amber-700 px-3 py-3 text-center font-bold text-xs text-amber-200 whitespace-nowrap min-w-[70px]">
                סה״כ
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((name, i) => {
              const rowBg = i % 2 === 0 ? 'bg-stone-950' : 'bg-stone-900/50';
              return (
                <tr key={name} className="group hover:bg-amber-950/10">
                  <td className={`sticky right-0 z-10 ${rowBg} group-hover:bg-amber-950/20 border-b border-l border-stone-800 px-3 py-2.5 font-bold text-stone-100 whitespace-nowrap shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]`}>
                    {name}
                  </td>
                  {years.map(y => {
                    const count = yearCounts[name]?.[y] || 0;
                    return (
                      <td key={y} className={`border-b border-stone-900 px-3 py-2.5 text-center tabular-nums whitespace-nowrap ${count > 0 ? 'text-stone-200' : 'text-stone-600'}`}>
                        {count || '—'}
                      </td>
                    );
                  })}
                  <td className={`sticky left-0 z-10 border-b border-r border-amber-800/50 px-3 py-2.5 tabular-nums text-center font-extrabold whitespace-nowrap bg-amber-950/50 text-amber-200`}>
                    {totalCounts[name]}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ===== טאב אירוחים מלא =====
const HostingTab = ({ hostingSchedule, isAdmin, onUpdate, players, addedBy, defaultFilter = 'upcoming' }) => {
  const [editingDate, setEditingDate] = useState(null);
  const [editHost, setEditHost] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);
  const [newHost, setNewHost] = useState({ date: '', dayName: 'שני', host: '', notes: '' });
  const [filter, setFilter] = useState(defaultFilter); // upcoming | past | all
  const today = new Date().toISOString().split('T')[0];

  const filtered = useMemo(() => {
    let list = [...hostingSchedule];
    if (filter === 'upcoming') list = list.filter(h => h.date >= today);
    else if (filter === 'past') list = list.filter(h => h.date < today);
    return list.sort((a, b) => filter === 'past' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
  }, [hostingSchedule, filter, today]);

  const startEdit = (h) => {
    setEditingDate(h.date);
    setEditHost(h.host || '');
    setEditNotes(h.notes || '');
  };

  const saveEdit = () => {
    const updated = hostingSchedule.map(h => 
      h.date === editingDate ? { ...h, host: editHost || null, notes: editNotes || null } : h
    );
    onUpdate(updated);
    setEditingDate(null);
  };

  const addNewHost = () => {
    if (!newHost.date) return alert('נא לבחור תאריך');
    const dayName = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][new Date(newHost.date).getDay()];
    const updated = [...hostingSchedule, { ...newHost, dayName, host: newHost.host || null, notes: newHost.notes || null }];
    onUpdate(updated);
    setShowAddNew(false);
    setNewHost({ date: '', dayName: 'שני', host: '', notes: '' });
  };

  const deleteEntry = (date) => {
    if (!confirm('למחוק את האירוח?')) return;
    onUpdate(hostingSchedule.filter(h => h.date !== date));
  };

  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950/50 backdrop-blur">
      <div className="border-b border-stone-800 bg-gradient-to-r from-amber-950/40 to-stone-900/40 px-4 md:px-6 py-4 flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg md:text-xl font-bold text-amber-200 flex items-center gap-2">
          🏠 לוח אירוחים ({hostingSchedule.length})
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-stone-700 bg-stone-900 p-1">
            <button onClick={() => setFilter('upcoming')}
              className={`px-3 py-1 text-xs rounded-md font-bold transition ${filter === 'upcoming' ? 'bg-amber-700 text-white' : 'text-stone-400'}`}>
              עתידיים
            </button>
            <button onClick={() => setFilter('past')}
              className={`px-3 py-1 text-xs rounded-md font-bold transition ${filter === 'past' ? 'bg-amber-700 text-white' : 'text-stone-400'}`}>
              עברו
            </button>
            <button onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs rounded-md font-bold transition ${filter === 'all' ? 'bg-amber-700 text-white' : 'text-stone-400'}`}>
              הכל
            </button>
          </div>
          {isAdmin && (
            <button onClick={() => setShowAddNew(true)}
              className="rounded-lg bg-amber-700 hover:bg-amber-600 px-3 py-1.5 text-sm text-white font-bold flex items-center gap-1">
              <Plus className="h-4 w-4" /> חדש
            </button>
          )}
        </div>
      </div>

      {showAddNew && isAdmin && (
        <div className="border-b border-stone-800 bg-amber-950/20 p-4">
          <div className="text-sm font-bold text-amber-200 mb-3">הוספת אירוח חדש</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input type="date" value={newHost.date} onChange={e => setNewHost({...newHost, date: e.target.value})}
              className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white text-sm" />
            <select value={newHost.host} onChange={e => setNewHost({...newHost, host: e.target.value})}
              className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white text-sm">
              <option value="">בחר מארח...</option>
              {players.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <input type="text" value={newHost.notes} onChange={e => setNewHost({...newHost, notes: e.target.value})}
            placeholder="הערות (אופציונלי)"
            className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white text-sm mb-2" />
          <div className="flex gap-2">
            <button onClick={() => setShowAddNew(false)} className="flex-1 rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-stone-300 text-sm">בטל</button>
            <button onClick={addNewHost} className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-white font-bold text-sm">שמור</button>
          </div>
        </div>
      )}

      <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
        {filtered.map(h => {
          const isFuture = h.date >= today;
          const isEditing = editingDate === h.date;
          return (
            <div key={h.date} className={`border-b border-stone-900 p-4 ${isFuture ? '' : 'opacity-60'} ${editingDate === h.date ? 'bg-amber-950/20' : 'hover:bg-stone-900/30'} transition`}>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="text-sm text-stone-400">{h.dayName} • {new Date(h.date).toLocaleDateString('he-IL', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                  <select value={editHost} onChange={e => setEditHost(e.target.value)}
                    className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-white text-sm">
                    <option value="">ללא מארח</option>
                    {players.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input type="text" value={editNotes} onChange={e => setEditNotes(e.target.value)}
                    placeholder="הערות"
                    className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-white text-sm" />
                  <div className="flex gap-2">
                    <button onClick={() => setEditingDate(null)} className="flex-1 rounded-lg border border-stone-700 bg-stone-800 py-1.5 text-xs text-stone-300">בטל</button>
                    <button onClick={() => deleteEntry(h.date)} className="rounded-lg border border-rose-800 bg-rose-950/50 py-1.5 px-3 text-xs text-rose-300">מחק</button>
                    <button onClick={saveEdit} className="flex-1 rounded-lg bg-emerald-600 py-1.5 text-xs text-white font-bold">שמור</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center border ${isFuture ? 'border-amber-700/50 bg-amber-950/30' : 'border-stone-800 bg-stone-900'}`}>
                      <div className="text-xs text-stone-500 leading-tight">{new Date(h.date).toLocaleDateString('he-IL', { month: 'short' })}</div>
                      <div className="text-base font-extrabold text-stone-100 leading-tight">{new Date(h.date).getDate()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-stone-400">יום {h.dayName}</div>
                      <div className="text-base font-bold text-stone-100">{h.host || <span className="text-stone-500 italic">לא נקבע</span>}</div>
                      {h.notes && <div className="text-xs text-stone-500 mt-0.5 italic">{h.notes}</div>}
                    </div>
                  </div>
                  {isAdmin && (
                    <button onClick={() => startEdit(h)} className="text-xs text-amber-400 hover:text-amber-300 px-2 py-1">
                      ערוך
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ===== טאב אירוחים עם בורר תצוגה =====
const HostingWrapper = ({ allSessions, hostingSchedule, players, sortedPlayers, isAdmin, onUpdate, adminName }) => {
  const [view, setView] = useState('upcoming'); // upcoming | history
  
  return (
    <div className="space-y-4">
      {/* בורר תצוגה */}
      <div className="flex rounded-2xl border border-stone-800 bg-stone-950/70 p-1.5 backdrop-blur">
        <button onClick={() => setView('upcoming')}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition flex items-center justify-center gap-2 ${
            view === 'upcoming'
              ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-900/40'
              : 'text-stone-400 hover:text-amber-200'
          }`}>
          🏠 מארחים הבאים
        </button>
        <button onClick={() => setView('history')}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition flex items-center justify-center gap-2 ${
            view === 'history'
              ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-900/40'
              : 'text-stone-400 hover:text-amber-200'
          }`}>
          📜 היסטוריה
        </button>
      </div>

      {/* תוכן לפי הבחירה */}
      {view === 'upcoming' ? (
        <HostingTab hostingSchedule={hostingSchedule} isAdmin={isAdmin}
          onUpdate={onUpdate} players={sortedPlayers} addedBy={adminName} defaultFilter="upcoming" />
      ) : (
        <div className="space-y-4">
          <HostingSummaryTable allSessions={allSessions} players={players} />
          <HostingTab hostingSchedule={hostingSchedule} isAdmin={isAdmin}
            onUpdate={onUpdate} players={sortedPlayers} addedBy={adminName} defaultFilter="past" />
        </div>
      )}
    </div>
  );
};

// ===== מודל ניהול חי של ערב =====
const LIVE_SESSION_KEY = 'poker_live_session_v1';

// ===== אלגוריתם חלוקת כספים חכמה - מינימום העברות =====
const calculateSettlements = (results) => {
  // results = { name: profit }
  // יוצרים שתי רשימות - חייבים ומקבלים
  const creditors = []; // מקבלים (רווח חיובי)
  const debtors = [];   // חייבים (הפסד שלילי)
  
  Object.entries(results).forEach(([name, amount]) => {
    if (amount > 0) creditors.push({ name, amount });
    else if (amount < 0) debtors.push({ name, amount: -amount }); // הופכים לחיובי
  });
  
  // מיון - מהגדול לקטן (חמדנות)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);
  
  const transfers = [];
  
  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0];
    const debtor = debtors[0];
    const transfer = Math.min(creditor.amount, debtor.amount);
    
    transfers.push({
      from: debtor.name,
      to: creditor.name,
      amount: transfer
    });
    
    creditor.amount -= transfer;
    debtor.amount -= transfer;
    
    // הסרה של הצד שהתאפס
    if (creditor.amount < 0.01) creditors.shift();
    if (debtor.amount < 0.01) debtors.shift();
  }
  
  return transfers;
};

const LiveSessionModal = ({ isOpen, onClose, onSave, players, currentSeason, adminName }) => {
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [host, setHost] = useState('');
  const [participants, setParticipants] = useState([]); // [{name, buyIns: 1}]
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [pendingAdditions, setPendingAdditions] = useState([]); // שחקנים שנבחרו בבחירה מרובה לפני אישור
  const [closing, setClosing] = useState(false);
  const [finalChips, setFinalChips] = useState({});
  const [settlementOpen, setSettlementOpen] = useState(false); // מודל חלוקת כספים
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false); // מודל אישור איפוס
  const [hasLoadedSaved, setHasLoadedSaved] = useState(false);

  // שמירה אוטומטית של מצב הערב לאחסון מקומי בדפדפן
  useEffect(() => {
    if (!isOpen || !hasLoadedSaved) return;
    const state = { sessionDate, host, participants, closing, finalChips };
    try {
      window.localStorage.setItem(LIVE_SESSION_KEY, JSON.stringify(state));
    } catch {}
  }, [sessionDate, host, participants, closing, finalChips, isOpen, hasLoadedSaved]);

  // טעינת מצב שמור כשפותחים
  useEffect(() => {
    if (!isOpen || hasLoadedSaved) return;
    try {
      const saved = window.localStorage.getItem(LIVE_SESSION_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        if (state.participants && state.participants.length > 0) {
          setSessionDate(state.sessionDate || new Date().toISOString().split('T')[0]);
          setHost(state.host || '');
          setParticipants(state.participants);
          setClosing(!!state.closing);
          setFinalChips(state.finalChips || {});
        }
      }
    } catch {}
    setHasLoadedSaved(true);
  }, [isOpen, hasLoadedSaved]);

  const reset = () => {
    setParticipants([]); setHost(''); setClosing(false); setFinalChips({});
    setPendingAdditions([]); setShowAddPlayer(false);
    setSessionDate(new Date().toISOString().split('T')[0]);
    try { window.localStorage.removeItem(LIVE_SESSION_KEY); } catch {}
  };

  const handleClose = () => {
    // סוגרים בלי לאפס - המצב נשמר וייטען בפעם הבאה שייפתח
    setHasLoadedSaved(false);
    onClose();
  };

  const handleStartFresh = () => {
    setResetConfirmOpen(true);
  };

  const handleConfirmReset = () => {
    reset();
    setResetConfirmOpen(false);
  };

  if (!isOpen) return null;

  // בחירה מרובה
  const togglePending = (name) => {
    if (pendingAdditions.includes(name)) {
      setPendingAdditions(pendingAdditions.filter(n => n !== name));
    } else {
      setPendingAdditions([...pendingAdditions, name]);
    }
  };

  const confirmAddPlayers = () => {
    const newOnes = pendingAdditions
      .filter(name => !participants.find(p => p.name === name))
      .map(name => ({ name, buyIns: 1 }));
    setParticipants([...participants, ...newOnes]);
    setPendingAdditions([]);
    setShowAddPlayer(false);
  };

  const cancelAddPlayers = () => {
    setPendingAdditions([]);
    setShowAddPlayer(false);
  };

  const addBuyIn = (name) => {
    setParticipants(participants.map(p => p.name === name ? { ...p, buyIns: p.buyIns + 1 } : p));
  };

  const removeBuyIn = (name) => {
    setParticipants(participants.map(p => p.name === name ? { ...p, buyIns: Math.max(1, p.buyIns - 1) } : p));
  };

  const removePlayer = (name) => {
    setParticipants(participants.filter(p => p.name !== name));
  };

  const totalPot = participants.reduce((sum, p) => sum + p.buyIns * 20, 0);
  const totalChipsOut = Object.values(finalChips).reduce((sum, c) => sum + (Number(c) || 0), 0);
  const balance = totalChipsOut - totalPot;
  const isBalanced = Math.abs(balance) < 0.01;

  const handleStartClosing = () => {
    if (participants.length < 2) return alert('צריך לפחות 2 שחקנים');
    setClosing(true);
    const initial = {};
    participants.forEach(p => {
      // שומר ערכים שכבר הוזנו אם חוזרים
      initial[p.name] = finalChips[p.name] !== undefined ? finalChips[p.name] : '';
    });
    setFinalChips(initial);
  };

  const handleFinalSave = () => {
    if (!isBalanced) return alert(`הסכומים לא מאוזנים! יש פער של ${balance > 0 ? '+' : ''}${balance} ₪`);
    
    const results = {};
    participants.forEach(p => {
      const chips = Number(finalChips[p.name]) || 0;
      const buyIn = p.buyIns * 20;
      results[p.name] = chips - buyIn;
    });
    
    onSave({
      date: sessionDate, season: currentSeason, pot: totalPot, results,
      host: host || undefined, addedBy: adminName, addedAt: new Date().toISOString(), liveTracked: true
    });
    reset();
    setHasLoadedSaved(false);
    onClose();
  };

  const availablePlayers = players.filter(p => !participants.find(part => part.name === p));
  const hasActiveSession = participants.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={handleClose}>
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-emerald-700/50 bg-stone-950 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-800 bg-stone-950/95 px-6 py-4 backdrop-blur">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-emerald-300 flex items-center gap-2">
              🎰 {closing ? 'סגירת ערב' : 'ניהול ערב חי'}
            </h2>
            <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-2">
              <span>{closing ? 'הזן את הצ׳יפים הסופיים' : 'הקניות נשמרות אוטומטית'}</span>
              {hasActiveSession && (
                <span className="text-emerald-400">• ערב פעיל</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveSession && !closing && (
              <button onClick={handleStartFresh}
                className="rounded-lg border border-rose-800/60 bg-rose-950/30 px-3 py-2 text-xs text-rose-300 hover:bg-rose-900/50 hover:border-rose-700 transition flex items-center gap-1.5 font-bold" title="התחל ערב מחדש - מחיקת כל הנתונים">
                <Trash2 className="h-4 w-4" />
                <span>נקה הכל</span>
              </button>
            )}
            <button onClick={handleClose}
              className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-300 hover:bg-stone-800 transition flex items-center gap-1.5 font-bold">
              <X className="h-4 w-4" />
              <span>סגור</span>
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {!closing && (
            <>
              {hasActiveSession && (
                <div className="rounded-xl bg-blue-950/30 border border-blue-800/50 p-3 text-xs text-blue-300 flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>נשמר אוטומטית. אפשר לצאת ולחזור מתי שתרצה - הכל יישאר.</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-stone-400 mb-1">תאריך</label>
                  <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)}
                    className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-xs text-stone-400 mb-1">מארח</label>
                  <select value={host} onChange={e => setHost(e.target.value)}
                    className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white">
                    <option value="">בחר...</option>
                    {players.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* סיכום הקופה */}
              <div className="rounded-xl bg-gradient-to-br from-emerald-950/50 to-stone-900 border border-emerald-800/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-emerald-400">קופה כוללת</div>
                    <div className="text-3xl font-extrabold text-white tabular-nums">{totalPot} ₪</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-stone-400">שחקנים</div>
                    <div className="text-xl font-bold text-emerald-300">{participants.length}</div>
                    <div className="text-xs text-stone-500">סה״כ {participants.reduce((s, p) => s + p.buyIns, 0)} קניות</div>
                  </div>
                </div>
              </div>

              {/* רשימת השחקנים */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-bold text-stone-300">שחקנים פעילים</div>
                  <button onClick={() => setShowAddPlayer(true)} disabled={availablePlayers.length === 0}
                    className="rounded-lg bg-amber-700 hover:bg-amber-600 px-3 py-1.5 text-xs text-white font-bold flex items-center gap-1 disabled:opacity-50">
                    <Plus className="h-3.5 w-3.5" /> הוסף שחקנים
                  </button>
                </div>
                
                {showAddPlayer && (
                  <div className="rounded-xl border border-amber-800 bg-stone-900 p-3 mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-stone-400">בחר שחקנים (מספר אנשים בו זמנית):</div>
                      <div className="text-xs text-amber-400 font-bold">{pendingAdditions.length} נבחרו</div>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-1.5 max-h-60 overflow-y-auto">
                      {availablePlayers.map(p => {
                        const isSelected = pendingAdditions.includes(p);
                        return (
                          <button key={p} onClick={() => togglePending(p)}
                            className={`rounded-md px-2 py-2 text-sm transition flex items-center justify-center gap-1 ${
                              isSelected
                                ? 'bg-amber-700 text-white font-bold ring-2 ring-amber-400'
                                : 'bg-stone-800 text-stone-200 hover:bg-stone-700'
                            }`}>
                            {isSelected && <Check className="h-3 w-3" />}
                            {p}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={cancelAddPlayers} className="flex-1 rounded-lg border border-stone-700 bg-stone-800 py-2 text-xs text-stone-300">ביטול</button>
                      <button onClick={confirmAddPlayers} disabled={pendingAdditions.length === 0}
                        className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2 text-sm text-white font-bold disabled:opacity-50">
                        הוסף {pendingAdditions.length > 0 ? `(${pendingAdditions.length})` : ''}
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {participants.length === 0 && !showAddPlayer && (
                    <div className="text-center py-8 text-stone-500 text-sm border border-dashed border-stone-700 rounded-xl">
                      עדיין לא הוספת שחקנים. לחץ "הוסף שחקנים" כדי להתחיל.
                    </div>
                  )}
                  {participants.map(p => (
                    <div key={p.name} className="rounded-xl border border-stone-800 bg-stone-900/50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-bold text-stone-100">{p.name}</div>
                          <div className="text-xs text-stone-500">{p.buyIns} {p.buyIns === 1 ? 'קניה' : 'קניות'} • {p.buyIns * 20} ₪</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => removeBuyIn(p.name)} disabled={p.buyIns <= 1}
                            className="w-9 h-9 rounded-lg bg-stone-800 hover:bg-rose-950 text-stone-300 hover:text-rose-300 font-bold disabled:opacity-30">−</button>
                          <div className="w-12 text-center text-xl font-extrabold text-amber-300 tabular-nums">{p.buyIns * 20}</div>
                          <button onClick={() => addBuyIn(p.name)}
                            className="w-9 h-9 rounded-lg bg-emerald-900/50 hover:bg-emerald-800 text-emerald-300 font-bold">+</button>
                          <button onClick={() => removePlayer(p.name)}
                            className="ml-1 rounded-lg p-2 text-stone-600 hover:text-rose-400 hover:bg-stone-800">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {participants.length >= 2 && (
                <button onClick={handleStartClosing}
                  className="w-full rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-3.5 font-bold text-white hover:from-emerald-500 hover:to-emerald-600 transition flex items-center justify-center gap-2">
                  <Check className="h-5 w-5" /> סיים ערב והכנס תוצאות
                </button>
              )}
            </>
          )}

          {closing && (
            <>
              <div className="rounded-xl bg-amber-950/30 border border-amber-800/50 p-3 text-sm text-amber-200">
                <div className="font-bold mb-1">⚠ הזן את הסכום הסופי של כל שחקן</div>
                <div className="text-xs text-amber-300/80">סה״כ הצ׳יפים שכל השחקנים מסיימים איתם חייב להיות שווה לקופה ({totalPot} ₪)</div>
              </div>

              <div className="space-y-2">
                {participants.map(p => {
                  const chips = Number(finalChips[p.name]) || 0;
                  const profit = chips - p.buyIns * 20;
                  return (
                    <div key={p.name} className="rounded-xl border border-stone-800 bg-stone-900/50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-bold text-stone-100">{p.name}</div>
                          <div className="text-xs text-stone-500">השקעה: {p.buyIns * 20} ₪</div>
                        </div>
                        <input type="number" value={finalChips[p.name]} onChange={e => setFinalChips({...finalChips, [p.name]: e.target.value})}
                          placeholder="צ׳יפים בסיום"
                          className="w-28 rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-white text-center text-sm tabular-nums" />
                        <div className={`w-20 text-left text-base font-extrabold tabular-nums ${profit > 0 ? 'text-emerald-400' : profit < 0 ? 'text-rose-400' : 'text-stone-500'}`}>
                          {profit > 0 ? '+' : ''}{profit}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={`rounded-xl border-2 p-3 ${isBalanced ? 'border-emerald-600 bg-emerald-950/30' : 'border-rose-700 bg-rose-950/30'}`}>
                <div className="flex items-center justify-between">
                  <div className={`text-sm font-bold ${isBalanced ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {isBalanced ? '✓ מאוזן! מוכן לשמירה' : `✗ פער של ${balance > 0 ? '+' : ''}${balance} ₪`}
                  </div>
                  <div className="text-xs text-stone-400">
                    {totalChipsOut} / {totalPot} ₪
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {/* כפתור חלוקת כספים - רק כשמאוזן */}
                {isBalanced && (
                  <button onClick={() => setSettlementOpen(true)}
                    className="w-full rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 px-4 py-3 font-bold text-white hover:from-amber-500 shadow-lg shadow-amber-900/40 flex items-center justify-center gap-2">
                    💰 חלוקת כספים - הצגה ושיתוף
                  </button>
                )}
                
                <div className="flex gap-2">
                  <button onClick={() => setClosing(false)} className="flex-1 rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-stone-300">חזור</button>
                  <button onClick={handleFinalSave} disabled={!isBalanced}
                    className="flex-1 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-3 font-bold text-white hover:from-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    <Check className="h-4 w-4" /> שמור ערב
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* מודל חלוקת כספים */}
      <SettlementModal 
        isOpen={settlementOpen} 
        onClose={() => setSettlementOpen(false)}
        participants={participants}
        finalChips={finalChips}
        host={host}
        sessionDate={sessionDate}
        totalPot={totalPot} />

      {/* מודל אישור איפוס */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setResetConfirmOpen(false)}>
          <div className="relative w-full max-w-sm rounded-2xl border-2 border-rose-800/60 bg-gradient-to-br from-stone-900 to-stone-950 p-6 shadow-2xl" 
            onClick={e => e.stopPropagation()} dir="rtl">
            
            <div className="flex flex-col items-center text-center mb-4">
              <div className="rounded-full bg-rose-900/30 border border-rose-700/50 p-3 mb-3">
                <AlertCircle className="h-8 w-8 text-rose-400" />
              </div>
              <h3 className="text-lg font-extrabold text-rose-200 mb-2">למחוק את הכל?</h3>
              <p className="text-sm text-stone-300 leading-relaxed">
                כל הקניות והנתונים של הערב הנוכחי יימחקו לצמיתות.
                <br/>
                <span className="text-rose-300 font-bold">זו פעולה שאי אפשר לבטל!</span>
              </p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setResetConfirmOpen(false)}
                className="flex-1 rounded-lg border border-stone-700 bg-stone-900 py-2.5 text-sm font-bold text-stone-300 hover:bg-stone-800">
                ביטול
              </button>
              <button onClick={handleConfirmReset}
                className="flex-1 rounded-lg bg-gradient-to-br from-rose-600 to-rose-700 py-2.5 text-sm font-bold text-white hover:from-rose-500 shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2">
                <Trash2 className="h-4 w-4" />
                כן, מחק
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== מודל חלוקת כספים ושיתוף =====
const SettlementModal = ({ isOpen, onClose, participants, finalChips, host, sessionDate, totalPot }) => {
  const shareCardRef = useRef(null);
  const [sharing, setSharing] = useState(false);

  // חישוב תוצאות וחלוקה
  const { results, playerData, transfers } = useMemo(() => {
    if (!participants || participants.length === 0) return { results: {}, playerData: [], transfers: [] };
    
    const results = {};
    const playerData = participants.map(p => {
      const chips = Number(finalChips[p.name]) || 0;
      const buyIn = p.buyIns * 20;
      const profit = chips - buyIn;
      results[p.name] = profit;
      return {
        name: p.name,
        buyIns: p.buyIns,
        buyInAmount: buyIn,
        finalChips: chips,
        profit
      };
    }).sort((a, b) => b.profit - a.profit);

    const transfers = calculateSettlements(results);
    return { results, playerData, transfers };
  }, [participants, finalChips]);

  const totalProfit = Object.values(results).reduce((s, v) => s + v, 0);
  const isBalanced = Math.abs(totalProfit) < 0.01;

  // הורדת תמונה
  const handleDownload = async () => {
    if (!shareCardRef.current) return;
    setSharing(true);
    try {
      // טעינת html2canvas דינמית
      if (!window.html2canvas) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const canvas = await window.html2canvas(shareCardRef.current, {
        backgroundColor: '#041810',
        scale: 2,
        logging: false,
        useCORS: true
      });

      canvas.toBlob(async (blob) => {
        const fileName = `פוקר_ברבורי_${sessionDate}.png`;
        
        // נסיון שיתוף native (מוביל לוואטסאפ)
        if (navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: 'image/png' })] })) {
          try {
            await navigator.share({
              files: [new File([blob], fileName, { type: 'image/png' })],
              title: 'חלוקת כספים - פוקר ברבורי תל מונד'
            });
            setSharing(false);
            return;
          } catch (e) {
            // אם ביטל - נוריד את הקובץ
          }
        }

        // fallback - הורדת קובץ
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSharing(false);
      }, 'image/png');
    } catch (e) {
      console.error('Failed to generate image:', e);
      alert('שגיאה ביצירת התמונה');
      setSharing(false);
    }
  };

  if (!isOpen) return null;

  const sessionDateObj = new Date(sessionDate);
  const dateStr = sessionDateObj.toLocaleDateString('he-IL', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div className="relative w-full max-w-lg my-4" onClick={e => e.stopPropagation()} dir="rtl">
        
        {/* כפתור סגירה */}
        <button onClick={onClose} 
          className="absolute -top-2 -left-2 z-10 rounded-full bg-stone-800 border border-stone-700 p-2 text-stone-300 hover:bg-stone-700 shadow-lg">
          <X className="h-5 w-5" />
        </button>

        {/* הכרטיס לשיתוף */}
        <div ref={shareCardRef} className="rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: 'radial-gradient(ellipse at center, #0f5132 0%, #0a3520 50%, #041810 100%)' }}>
          
          {/* כותרת */}
          <div className="text-center py-5 px-4 border-b border-amber-900/30"
            style={{ background: 'linear-gradient(180deg, rgba(251, 191, 36, 0.05) 0%, transparent 100%)' }}>
            <div className="text-4xl mb-1">🃏</div>
            <div className="text-xs text-amber-300/80 tracking-[0.2em] font-bold mb-1">פוקר ברבורי תל מונד</div>
            <div className="text-lg font-extrabold text-amber-200">חלוקת כספים</div>
            <div className="text-xs text-stone-300 mt-1">{dateStr}</div>
            {host && <div className="text-xs text-emerald-300 mt-0.5">🏠 מארח: {host}</div>}
          </div>

          {/* טבלת תוצאות */}
          <div className="p-4">
            <div className="text-xs text-amber-300/80 font-bold tracking-wider uppercase mb-2 text-center">📊 סיכום הערב</div>
            <div className="rounded-xl bg-black/30 border border-stone-700/50 overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 bg-amber-950/40 border-b border-stone-700/50 text-xs font-bold text-amber-200">
                <div>שחקן</div>
                <div className="w-12 text-center">קניות</div>
                <div className="w-14 text-center">החזר</div>
                <div className="w-16 text-center">סופי</div>
              </div>
              {playerData.map((p, i) => (
                <div key={p.name} className={`grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 text-sm ${
                  i % 2 === 0 ? 'bg-black/20' : 'bg-black/10'
                }`}>
                  <div className="font-bold text-stone-100">{p.name}</div>
                  <div className="w-12 text-center text-stone-400 tabular-nums">{p.buyInAmount}</div>
                  <div className="w-14 text-center text-stone-300 tabular-nums">{p.finalChips}</div>
                  <div className={`w-16 text-center font-extrabold tabular-nums ${
                    p.profit > 0 ? 'text-emerald-400' : p.profit < 0 ? 'text-rose-400' : 'text-stone-500'
                  }`}>
                    {p.profit > 0 ? '+' : ''}{p.profit}
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 bg-amber-950/30 border-t border-stone-700/50 text-xs text-amber-200 font-bold">
                <div>קופה כוללת</div>
                <div className="text-center tabular-nums">{totalPot} ₪</div>
              </div>
            </div>
          </div>

          {/* חלוקת העברות */}
          {transfers.length > 0 && (
            <div className="px-4 pb-4">
              <div className="text-xs text-amber-300/80 font-bold tracking-wider uppercase mb-2 text-center">
                💸 העברות ({transfers.length})
              </div>
              <div className="space-y-1.5">
                {transfers.map((t, i) => (
                  <div key={i} className="rounded-lg bg-gradient-to-r from-rose-950/30 via-stone-900/50 to-emerald-950/30 border border-stone-700/40 px-3 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-bold text-rose-300">{t.from}</span>
                      <span className="text-stone-400">←</span>
                      <span className="font-bold text-emerald-300">{t.to}</span>
                    </div>
                    <div className="text-base font-extrabold text-amber-300 tabular-nums">
                      {t.amount} ₪
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* אישור איזון */}
          <div className="px-4 pb-4">
            <div className={`rounded-lg border px-3 py-2 text-xs font-bold text-center ${
              isBalanced 
                ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300' 
                : 'bg-rose-950/40 border-rose-700/50 text-rose-300'
            }`}>
              {isBalanced ? '✓ הכל מאוזן - סה״כ העברות: ' + transfers.reduce((s, t) => s + t.amount, 0) + ' ₪' : '⚠ חוסר איזון!'}
            </div>
          </div>

          {/* חתימה */}
          <div className="text-center py-3 px-4 bg-black/30 border-t border-amber-900/20">
            <div className="text-xs text-amber-300/60 tracking-widest">♠ BARBUR AI ♠</div>
          </div>
        </div>

        {/* כפתורי פעולה */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={onClose}
            className="rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-stone-300 hover:bg-stone-800 font-bold">
            סגור
          </button>
          <button onClick={handleDownload} disabled={sharing}
            className="rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 px-4 py-3 font-bold text-white hover:from-amber-500 shadow-lg shadow-amber-900/40 flex items-center justify-center gap-2 disabled:opacity-50">
            {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {sharing ? 'מכין...' : 'שתף / הורד'}
          </button>
        </div>
      </div>
    </div>
  );
};


// ===== טאב טבלאות תקופתיות =====
const getMonthKey = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const getQuarterKey = (dateStr) => {
  const d = new Date(dateStr);
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()}-Q${q}`;
};

const getHalfKey = (dateStr) => {
  const d = new Date(dateStr);
  const h = d.getMonth() < 6 ? 1 : 2;
  return `${d.getFullYear()}-H${h}`;
};

const HEBREW_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

const getMonthLabel = (key) => {
  const [y, m] = key.split('-');
  return HEBREW_MONTHS[parseInt(m) - 1];
};

const getQuarterLabel = (key) => {
  const [y, q] = key.split('-');
  return q;
};

const getHalfLabel = (key) => {
  const [y, h] = key.split('-');
  return h;
};

const aggregateByPeriod = (sessions, players, keyFn) => {
  // מקבץ תוצאות לפי תקופה
  const byPeriod = {}; // {periodKey: {playerName: sum}}
  const allKeys = new Set();
  
  sessions.forEach(s => {
    const key = keyFn(s.date);
    allKeys.add(key);
    if (!byPeriod[key]) byPeriod[key] = {};
    Object.entries(s.results || {}).forEach(([name, amount]) => {
      byPeriod[key][name] = (byPeriod[key][name] || 0) + amount;
    });
  });
  
  const sortedKeys = Array.from(allKeys).sort();
  return { sortedKeys, byPeriod };
};

const PeriodicTables = ({ allSessions, players }) => {
  const [viewMode, setViewMode] = useState('month'); // month | quarter | half
  
  // זיהוי כל השנים הזמינות
  const availableYears = useMemo(() => {
    const years = new Set(allSessions.map(s => s.season || new Date(s.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [allSessions]);
  
  const [selectedYear, setSelectedYear] = useState(availableYears[0] || 2026);
  
  // סינון לפי שנה
  const sessions = useMemo(() => 
    allSessions.filter(s => (s.season || new Date(s.date).getFullYear()) === selectedYear),
    [allSessions, selectedYear]
  );
  
  const { keyFn, getLabel, viewLabel } = useMemo(() => {
    if (viewMode === 'month') return { keyFn: getMonthKey, getLabel: getMonthLabel, viewLabel: 'חודשית' };
    if (viewMode === 'quarter') return { keyFn: getQuarterKey, getLabel: getQuarterLabel, viewLabel: 'רבעונית' };
    return { keyFn: getHalfKey, getLabel: getHalfLabel, viewLabel: 'חצי שנתית' };
  }, [viewMode]);
  
  const { sortedKeys, byPeriod } = useMemo(() => 
    aggregateByPeriod(sessions, players, keyFn), [sessions, players, keyFn]);
  
  // רק שחקנים שיש להם נתונים בתקופה כלשהי
  const activePlayers = useMemo(() => {
    const set = new Set();
    sortedKeys.forEach(k => {
      Object.keys(byPeriod[k] || {}).forEach(name => set.add(name));
    });
    // מיון לפי סה״כ רווח יורד
    return Array.from(set).sort((a, b) => {
      const sumA = sortedKeys.reduce((s, k) => s + (byPeriod[k]?.[a] || 0), 0);
      const sumB = sortedKeys.reduce((s, k) => s + (byPeriod[k]?.[b] || 0), 0);
      return sumB - sumA;
    });
  }, [sortedKeys, byPeriod]);

  const formatCell = (val) => {
    if (!val || val === 0) return '0';
    return val > 0 ? `+${val}` : `${val}`;
  };
  
  const cellColor = (val) => {
    if (!val || val === 0) return 'text-stone-500';
    if (val > 0) return 'bg-emerald-900/40 text-emerald-300 font-bold';
    return 'bg-rose-900/40 text-rose-300 font-bold';
  };

  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950/50 backdrop-blur overflow-hidden">
      <div className="border-b border-stone-800 bg-gradient-to-r from-amber-950/40 to-stone-900/40 px-4 md:px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg md:text-xl font-bold text-amber-200 flex items-center gap-2">
          📊 טבלה {viewLabel} — {selectedYear}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-1.5 text-sm text-white font-bold">
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="flex rounded-lg border border-stone-700 bg-stone-900 p-1">
            <button onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-xs rounded-md font-bold transition ${viewMode === 'month' ? 'bg-amber-700 text-white' : 'text-stone-400 hover:text-stone-200'}`}>
              חודשית
            </button>
            <button onClick={() => setViewMode('quarter')}
              className={`px-3 py-1.5 text-xs rounded-md font-bold transition ${viewMode === 'quarter' ? 'bg-amber-700 text-white' : 'text-stone-400 hover:text-stone-200'}`}>
              רבעונית
            </button>
            <button onClick={() => setViewMode('half')}
              className={`px-3 py-1.5 text-xs rounded-md font-bold transition ${viewMode === 'half' ? 'bg-amber-700 text-white' : 'text-stone-400 hover:text-stone-200'}`}>
              חצי שנתית
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-auto max-h-[calc(100vh-280px)]" dir="rtl">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="sticky top-0 right-0 z-30 bg-stone-900 border-b-2 border-l border-stone-700 px-3 py-3 text-right font-bold text-xs text-amber-200 min-w-[90px] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]">
                שחקן
              </th>
              {sortedKeys.map(k => (
                <th key={k} className="sticky top-0 z-20 bg-stone-900 border-b-2 border-stone-700 px-3 py-3 text-center font-bold text-xs text-amber-200 whitespace-nowrap min-w-[80px]">
                  {getLabel(k)}
                </th>
              ))}
              <th className="sticky top-0 left-0 z-30 bg-amber-950/50 border-b-2 border-r border-amber-700 px-3 py-3 text-center font-bold text-xs text-amber-200 whitespace-nowrap min-w-[80px]">
                סה״כ
              </th>
            </tr>
          </thead>
          <tbody>
            {activePlayers.map((name, i) => {
              const rowBg = i % 2 === 0 ? 'bg-stone-950' : 'bg-stone-900/50';
              const total = sortedKeys.reduce((s, k) => s + (byPeriod[k]?.[name] || 0), 0);
              return (
                <tr key={name} className="group hover:bg-amber-950/10">
                  <td className={`sticky right-0 z-10 ${rowBg} group-hover:bg-amber-950/20 border-b border-l border-stone-800 px-3 py-2.5 font-bold text-stone-100 whitespace-nowrap shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]`}>
                    {name}
                  </td>
                  {sortedKeys.map(k => {
                    const val = byPeriod[k]?.[name];
                    return (
                      <td key={k} className={`border-b border-stone-900 px-3 py-2.5 tabular-nums text-center whitespace-nowrap ${cellColor(val)}`}>
                        {formatCell(val)}
                      </td>
                    );
                  })}
                  <td className={`sticky left-0 z-10 border-b border-r border-amber-800/50 px-3 py-2.5 tabular-nums text-center font-extrabold whitespace-nowrap ${
                    total > 0 ? 'bg-emerald-950/60 text-emerald-300' : total < 0 ? 'bg-rose-950/60 text-rose-300' : 'bg-stone-900/80 text-stone-400'
                  }`}>
                    {formatCell(total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="border-t border-stone-800 bg-stone-900/40 px-4 py-3 text-xs text-stone-500 flex items-center gap-4 flex-wrap">
        <span>🟢 רווח</span>
        <span>🔴 הפסד</span>
        <span>• המספרים בעמודות מראים את הרווח/הפסד בתקופה</span>
      </div>
    </div>
  );
};


// ===== דשבורד קומפקטי =====
const DashboardCarousel = ({ currentUser, sessions, stats, hostingSchedule, onGoToHosting, onFullscreenToggle, selectedChartPlayers, setSelectedChartPlayers, isMobile }) => {
  return (
    <div className="space-y-3">
      <PersonalInsights playerName={currentUser} sessions={sessions} stats={stats} hostingSchedule={hostingSchedule} />
      <NextHostsCarouselCompact hostingSchedule={hostingSchedule} onSeeAll={onGoToHosting} />
      <TopThreeCarousel stats={stats} />
      <SpecialStatsCarousel stats={stats} />
      <div className="rounded-2xl border border-stone-800 bg-stone-950/40 backdrop-blur p-2">
        <CumulativeChart sessions={sessions} stats={stats} fullscreen={false}
          onFullscreenToggle={onFullscreenToggle}
          selectedPlayers={selectedChartPlayers}
          onPlayersChange={setSelectedChartPlayers}
          isMobile={isMobile} />
      </div>
    </div>
  );
};

// ===== קרוסלה של 3 המארחים הבאים =====
const NextHostsCarouselCompact = ({ hostingSchedule, onSeeAll }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef(null);

  const today = new Date().toISOString().split('T')[0];
  const upcoming = hostingSchedule
    .filter(h => h.date >= today && h.host)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  if (upcoming.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-800 bg-stone-950/50 p-6 text-center">
        <div className="text-4xl mb-2">📅</div>
        <div className="text-stone-400 text-sm">אין עדיין מארחים בלוח</div>
      </div>
    );
  }

  const goToSlide = (idx) => {
    if (scrollRef.current) {
      const w = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({ left: -idx * w, behavior: 'smooth' });
      setCurrentSlide(idx);
    }
  };

  const handleScroll = (e) => {
    const w = e.target.offsetWidth;
    const idx = Math.round(Math.abs(e.target.scrollLeft) / w);
    if (idx !== currentSlide) setCurrentSlide(idx);
  };

  return (
    <div className="rounded-2xl border-2 border-emerald-700/40 bg-gradient-to-br from-emerald-950/30 via-stone-900/40 to-stone-950/40 p-4 backdrop-blur">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base md:text-lg font-extrabold text-amber-200 flex items-center gap-2">
          🏠 המארחים הבאים
        </h3>
        <button onClick={onSeeAll} className="text-xs text-amber-400 hover:text-amber-300 font-bold">
          הכל →
        </button>
      </div>

      <div className="relative">
        {currentSlide > 0 && (
          <button onClick={() => goToSlide(currentSlide - 1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-600/50 text-emerald-200 w-8 h-8 flex items-center justify-center shadow-lg">
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
        {currentSlide < upcoming.length - 1 && (
          <button onClick={() => goToSlide(currentSlide + 1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-600/50 text-emerald-200 w-8 h-8 flex items-center justify-center shadow-lg">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div ref={scrollRef} onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
          style={{ scrollbarWidth: 'none' }} dir="rtl">
          {upcoming.map((h, i) => {
            const date = new Date(h.date);
            const isFirst = i === 0;
            return (
              <div key={h.date} className="min-w-full snap-center px-1">
                <div className={`rounded-2xl border ${
                  isFirst ? 'border-amber-600/60 bg-gradient-to-br from-amber-900/30 to-stone-900/50' : 'border-emerald-700/40 bg-gradient-to-br from-emerald-900/20 to-stone-900/50'
                } p-5 flex flex-col items-center justify-center text-center`} style={{ minHeight: '140px' }}>
                  <div className="text-3xl mb-1">{isFirst ? '🎯' : '📅'}</div>
                  <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${isFirst ? 'text-amber-300' : 'text-emerald-300'}`}>
                    {isFirst ? 'המפגש הקרוב' : `בעוד ${i + 1}`}
                  </div>
                  <div className="text-2xl md:text-3xl font-extrabold text-stone-100 leading-none mb-2">{h.host}</div>
                  <div className="text-xs md:text-sm text-stone-300">
                    {h.dayName}, {date.toLocaleDateString('he-IL', { day: '2-digit', month: 'long' })}
                  </div>
                  {h.notes && <div className="text-xs text-stone-500 mt-1 italic">{h.notes}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-3">
        {upcoming.map((_, i) => (
          <button key={i} onClick={() => goToSlide(i)}
            className={`transition-all rounded-full ${
              i === currentSlide ? 'w-6 h-1.5 bg-amber-400' : 'w-1.5 h-1.5 bg-stone-700 hover:bg-stone-600'
            }`} />
        ))}
      </div>
    </div>
  );
};

// ===== קרוסלה של הפודיום =====
const TopThreeCarousel = ({ stats }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef(null);

  const top3 = stats.slice(0, 3);
  if (top3.length === 0) {
    return <div className="rounded-2xl border border-stone-800 bg-stone-950/50 p-6 text-center text-stone-400 text-sm">אין עדיין נתונים</div>;
  }

  const goToSlide = (idx) => {
    if (scrollRef.current) {
      const w = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({ left: -idx * w, behavior: 'smooth' });
      setCurrentSlide(idx);
    }
  };

  const handleScroll = (e) => {
    const w = e.target.offsetWidth;
    const idx = Math.round(Math.abs(e.target.scrollLeft) / w);
    if (idx !== currentSlide) setCurrentSlide(idx);
  };

  const medals = ['🥇', '🥈', '🥉'];
  const gradients = [
    'from-amber-600/40 to-amber-900/30 border-amber-500/60',
    'from-stone-400/20 to-stone-700/30 border-stone-400/50',
    'from-orange-700/30 to-orange-900/30 border-orange-600/50'
  ];

  return (
    <div className="rounded-2xl border-2 border-amber-700/40 bg-gradient-to-br from-amber-950/20 via-stone-900/40 to-stone-950/40 p-4 backdrop-blur">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base md:text-lg font-extrabold text-amber-200 flex items-center gap-2">
          🏆 פודיום העונה
        </h3>
        <div className="text-xs text-amber-300/80 font-bold bg-amber-950/50 px-2 py-0.5 rounded-lg border border-amber-800/40">{currentSlide + 1}/{top3.length}</div>
      </div>

      <div className="relative">
        {currentSlide > 0 && (
          <button onClick={() => goToSlide(currentSlide - 1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-amber-900/80 hover:bg-amber-800 border border-amber-600/50 text-amber-200 w-8 h-8 flex items-center justify-center shadow-lg">
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
        {currentSlide < top3.length - 1 && (
          <button onClick={() => goToSlide(currentSlide + 1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-amber-900/80 hover:bg-amber-800 border border-amber-600/50 text-amber-200 w-8 h-8 flex items-center justify-center shadow-lg">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div ref={scrollRef} onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
          style={{ scrollbarWidth: 'none' }} dir="rtl">
          {top3.map((p, i) => (
            <div key={p.name} className="min-w-full snap-center px-1">
              <div className={`rounded-2xl border bg-gradient-to-br ${gradients[i]} p-5 flex flex-col items-center justify-center text-center`} style={{ minHeight: '140px' }}>
                <div className="text-4xl mb-1">{medals[i]}</div>
                <div className="text-xs text-amber-200/80 font-bold uppercase tracking-wider mb-1">מקום {i + 1}</div>
                <div className="text-3xl md:text-4xl font-extrabold text-stone-100 leading-none mb-1">{p.name}</div>
                <div className="text-2xl md:text-3xl font-extrabold text-emerald-400 tabular-nums drop-shadow-lg">
                  +{p.total} ₪
                </div>
                <div className="text-xs md:text-sm text-stone-300 mt-1">{p.sessions} מפגשים · {p.winRate.toFixed(0)}% ניצחון</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-3">
        {top3.map((_, i) => (
          <button key={i} onClick={() => goToSlide(i)}
            className={`transition-all rounded-full ${
              i === currentSlide ? 'w-6 h-1.5 bg-amber-400' : 'w-1.5 h-1.5 bg-stone-700 hover:bg-stone-600'
            }`} />
        ))}
      </div>
    </div>
  );
};

// ===== קרוסלה של סטטיסטיקות מיוחדות =====
const SpecialStatsCarousel = ({ stats }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef(null);

  if (stats.length === 0) return null;

  const topWinner = stats[0];
  const bottomLoser = stats[stats.length - 1];
  const biggestWin = [...stats].sort((a, b) => b.biggestWin - a.biggestWin)[0];
  const biggestLoss = [...stats].sort((a, b) => a.biggestLoss - b.biggestLoss)[0];
  const longestStreak = [...stats].sort((a, b) => b.maxStreak - a.maxStreak)[0];
  const mostActive = [...stats].sort((a, b) => b.sessions - a.sessions)[0];

  const slides = [
    { emoji: '👑', label: 'מלך הכסף', value: topWinner.name, sub: `+${topWinner.total} ₪`, valueClass: 'text-amber-300', bgClass: 'from-amber-900/40 to-stone-900/50', borderClass: 'border-amber-700/50' },
    { emoji: '💀', label: 'הלוזר הגדול', value: bottomLoser.name, sub: `${bottomLoser.total} ₪`, valueClass: 'text-rose-400', bgClass: 'from-rose-900/30 to-stone-900/50', borderClass: 'border-rose-700/40' },
    { emoji: '🔥', label: 'שיא רווח בערב אחד', value: biggestWin.name, sub: `+${biggestWin.biggestWin} ₪`, valueClass: 'text-orange-400', bgClass: 'from-orange-900/30 to-stone-900/50', borderClass: 'border-orange-700/40' },
    { emoji: '💔', label: 'שיא הפסד בערב אחד', value: biggestLoss.name, sub: `${biggestLoss.biggestLoss} ₪`, valueClass: 'text-rose-400', bgClass: 'from-rose-900/30 to-stone-900/50', borderClass: 'border-rose-700/40' },
    { emoji: '⚡', label: 'רצף ניצחונות ארוך', value: longestStreak.name, sub: `${longestStreak.maxStreak} ערבים ברצף`, valueClass: 'text-violet-300', bgClass: 'from-violet-900/30 to-stone-900/50', borderClass: 'border-violet-700/40' },
    { emoji: '🎯', label: 'המתמיד', value: mostActive.name, sub: `${mostActive.sessions} מפגשים`, valueClass: 'text-emerald-400', bgClass: 'from-emerald-900/30 to-stone-900/50', borderClass: 'border-emerald-700/40' },
  ];

  const goToSlide = (idx) => {
    if (scrollRef.current) {
      const w = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({ left: -idx * w, behavior: 'smooth' });
      setCurrentSlide(idx);
    }
  };

  const handleScroll = (e) => {
    const w = e.target.offsetWidth;
    const idx = Math.round(Math.abs(e.target.scrollLeft) / w);
    if (idx !== currentSlide) setCurrentSlide(idx);
  };

  return (
    <div className="rounded-2xl border-2 border-violet-700/40 bg-gradient-to-br from-violet-950/20 via-stone-900/40 to-stone-950/40 p-4 backdrop-blur">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base md:text-lg font-extrabold text-amber-200 flex items-center gap-2">
          ⚡ סטטיסטיקות מיוחדות
        </h3>
        <div className="text-xs text-amber-300/80 font-bold bg-amber-950/50 px-2 py-0.5 rounded-lg border border-amber-800/40">{currentSlide + 1}/{slides.length}</div>
      </div>

      <div className="relative">
        {currentSlide > 0 && (
          <button onClick={() => goToSlide(currentSlide - 1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-violet-900/80 hover:bg-violet-800 border border-violet-600/50 text-violet-200 w-8 h-8 flex items-center justify-center shadow-lg">
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
        {currentSlide < slides.length - 1 && (
          <button onClick={() => goToSlide(currentSlide + 1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-violet-900/80 hover:bg-violet-800 border border-violet-600/50 text-violet-200 w-8 h-8 flex items-center justify-center shadow-lg">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div ref={scrollRef} onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
          style={{ scrollbarWidth: 'none' }} dir="rtl">
          {slides.map((slide, i) => (
            <div key={i} className="min-w-full snap-center px-1">
              <div className={`rounded-2xl border ${slide.borderClass} bg-gradient-to-br ${slide.bgClass} p-5 flex flex-col items-center justify-center text-center`} style={{ minHeight: '140px' }}>
                <div className="text-3xl mb-1">{slide.emoji}</div>
                <div className="text-xs text-amber-200/80 font-bold uppercase tracking-wider mb-1">{slide.label}</div>
                <div className={`text-3xl md:text-4xl font-extrabold ${slide.valueClass} leading-none mb-2 drop-shadow-lg`}>
                  {slide.value}
                </div>
                <div className="text-sm md:text-base text-stone-200 font-bold">{slide.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-3">
        {slides.map((_, i) => (
          <button key={i} onClick={() => goToSlide(i)}
            className={`transition-all rounded-full ${
              i === currentSlide ? 'w-6 h-1.5 bg-amber-400' : 'w-1.5 h-1.5 bg-stone-700 hover:bg-stone-600'
            }`} />
        ))}
      </div>
    </div>
  );
};


// ===== גלריית ידיים מנצחות =====
const GalleryTab = ({ images, likes, currentUser, isAdmin, onAdd, onDelete, onLike, onUpdateNote }) => {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewingIndex, setViewingIndex] = useState(null);
  const [filterUploader, setFilterUploader] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // רשימת המעלים (לפילטר)
  const uploaders = useMemo(() => {
    const s = new Set(images.map(img => img.uploadedBy).filter(Boolean));
    return Array.from(s).sort();
  }, [images]);

  // סינון ומיון
  const visibleImages = useMemo(() => {
    let list = images;
    if (filterUploader !== 'all') {
      list = list.filter(img => img.uploadedBy === filterUploader);
    }
    if (sortBy === 'likes') {
      list = [...list].sort((a, b) => (likes[b.id] || 0) - (likes[a.id] || 0));
    } else {
      list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return list;
  }, [images, likes, filterUploader, sortBy]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-stone-800 bg-stone-950/50 backdrop-blur p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h3 className="text-lg md:text-xl font-bold text-amber-200 flex items-center gap-2">
            🃏 גלריית ידיים מנצחות ({visibleImages.length})
          </h3>
          <button onClick={() => setUploadOpen(true)}
            className="rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 px-4 py-2 text-sm font-bold text-white hover:from-amber-500 hover:to-amber-600 shadow-lg shadow-amber-900/40 flex items-center gap-2">
            <Camera className="h-4 w-4" />
            העלה תמונה
          </button>
        </div>
        
        <div className="text-xs text-stone-400 mb-3">
          💡 יש לך יד מנצחת שאתה גאה בה? העלה תמונה והוסף הערה!
        </div>

        {/* פילטרים */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <select value={filterUploader} onChange={e => setFilterUploader(e.target.value)}
              className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-white">
              <option value="all">כל המעלים</option>
              {uploaders.map(name => (
                <option key={name} value={name}>של {name}</option>
              ))}
            </select>
            <div className="flex rounded-lg border border-stone-700 bg-stone-900 p-1">
              <button onClick={() => setSortBy('newest')}
                className={`px-3 py-1 text-xs rounded-md font-bold transition ${sortBy === 'newest' ? 'bg-amber-700 text-white' : 'text-stone-400'}`}>
                חדשים
              </button>
              <button onClick={() => setSortBy('likes')}
                className={`px-3 py-1 text-xs rounded-md font-bold transition ${sortBy === 'likes' ? 'bg-amber-700 text-white' : 'text-stone-400'}`}>
                אהובים
              </button>
            </div>
          </div>
        )}
      </div>

      {/* רשת תמונות */}
      {visibleImages.length === 0 ? (
        <div className="rounded-2xl border border-stone-800 bg-stone-950/50 p-12 text-center">
          <div className="text-6xl mb-3 opacity-40">📸</div>
          <div className="text-stone-400 text-sm">
            {images.length === 0 
              ? 'עדיין אין תמונות. תהיה הראשון!' 
              : 'אין תמונות מהפילטר הזה'}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {visibleImages.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setViewingIndex(idx)}
              className="relative aspect-square rounded-xl overflow-hidden border border-stone-800 bg-stone-900 hover:border-amber-600/60 transition group">
              <img src={img.dataUrl} alt={img.note || 'hand'} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              
              {/* overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100" />
              
              {/* לייקים */}
              {(likes[img.id] || 0) > 0 && (
                <div className="absolute top-2 left-2 rounded-full bg-black/60 backdrop-blur px-2 py-0.5 text-xs text-rose-300 font-bold flex items-center gap-1">
                  <Heart className="h-3 w-3 fill-rose-400 text-rose-400" />
                  {likes[img.id]}
                </div>
              )}
              
              {/* הערה */}
              {img.note && (
                <div className="absolute bottom-0 right-0 left-0 p-2 text-right">
                  <div className="text-xs text-white font-bold truncate">
                    {img.note}
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* מודל העלאה */}
      <GalleryUploadModal 
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        currentUser={currentUser}
        onUpload={onAdd} />

      {/* מודל תצוגה */}
      {viewingIndex !== null && visibleImages[viewingIndex] && (
        <GalleryImageModal
          image={visibleImages[viewingIndex]}
          likes={likes[visibleImages[viewingIndex].id] || 0}
          currentUser={currentUser}
          isAdmin={isAdmin}
          canGoNext={viewingIndex < visibleImages.length - 1}
          canGoPrev={viewingIndex > 0}
          onNext={() => setViewingIndex(viewingIndex + 1)}
          onPrev={() => setViewingIndex(viewingIndex - 1)}
          onClose={() => setViewingIndex(null)}
          onLike={() => onLike(visibleImages[viewingIndex].id)}
          onDelete={() => { onDelete(visibleImages[viewingIndex].id); setViewingIndex(null); }}
          onUpdateNote={(note) => onUpdateNote(visibleImages[viewingIndex].id, note)} />
      )}
    </div>
  );
};

// ===== מודל העלאת תמונה =====
const GalleryUploadModal = ({ isOpen, onClose, currentUser, onUpload }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileSelect = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    
    if (!selected.type.startsWith('image/')) {
      setError('חובה לבחור קובץ תמונה');
      return;
    }
    
    setError('');
    setFile(selected);
    
    // תצוגה מקדימה
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selected);
  };

  const compressImage = (file, maxWidth = 1200, quality = 0.82) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          
          // שמירה על יחס
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (!file) {
      setError('בחר תמונה תחילה');
      return;
    }
    
    setUploading(true);
    setError('');
    
    try {
      // דחיסה
      const compressed = await compressImage(file);
      
      const newImage = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        dataUrl: compressed,
        note: note.trim(),
        uploadedBy: currentUser,
        createdAt: new Date().toISOString()
      };
      
      await onUpload(newImage);
      
      // איפוס
      setFile(null);
      setPreview(null);
      setNote('');
      setUploading(false);
      onClose();
    } catch (e) {
      console.error('Upload error:', e);
      setError('שגיאה בהעלאה. נסה שוב.');
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="relative w-full max-w-md my-4 rounded-2xl border-2 border-amber-700/50 bg-gradient-to-br from-stone-900 to-stone-950 p-5 shadow-2xl"
        onClick={e => e.stopPropagation()} dir="rtl">
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-extrabold text-amber-200">העלאת תמונה לגלריה</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* בחירת קובץ */}
        {!preview ? (
          <label className="block rounded-xl border-2 border-dashed border-stone-700 hover:border-amber-600/60 bg-stone-950/50 p-8 text-center cursor-pointer transition">
            <Camera className="h-12 w-12 mx-auto text-stone-500 mb-2" />
            <div className="text-sm text-stone-300 font-bold">לחץ לבחירת תמונה</div>
            <div className="text-xs text-stone-500 mt-1">מהגלריה או מצלמה</div>
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </label>
        ) : (
          <div className="relative">
            <img src={preview} alt="preview" className="w-full rounded-xl border border-stone-700" />
            <button onClick={() => { setFile(null); setPreview(null); }}
              className="absolute top-2 left-2 rounded-full bg-black/70 backdrop-blur p-1.5 text-white hover:bg-black/90">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* הערה */}
        <div className="mt-4">
          <label className="block text-xs text-stone-400 font-bold mb-1.5">הערה (אופציונלי)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder='"פור אס נגד רויאל פלאש... דמעות"'
            rows={2}
            maxLength={150}
            className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white text-sm focus:border-amber-600 focus:outline-none resize-none" />
          <div className="text-xs text-stone-500 mt-1 text-left">{note.length}/150</div>
        </div>

        {/* מעלה - אוטומטי */}
        <div className="mt-3 text-xs text-stone-400 bg-stone-900/50 border border-stone-800 rounded-lg px-3 py-2">
          מעלה: <span className="font-bold text-amber-300">{currentUser}</span>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-rose-700/50 bg-rose-950/30 text-rose-300 text-sm px-3 py-2 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* כפתורים */}
        <div className="mt-4 flex gap-2">
          <button onClick={onClose} disabled={uploading}
            className="flex-1 rounded-lg border border-stone-700 bg-stone-900 py-2.5 text-sm font-bold text-stone-300 hover:bg-stone-800">
            ביטול
          </button>
          <button onClick={handleUpload} disabled={!file || uploading}
            className="flex-1 rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 py-2.5 text-sm font-bold text-white hover:from-amber-500 hover:to-amber-600 shadow-lg shadow-amber-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'מעלה...' : 'העלה תמונה'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== מודל תצוגה מלאה של תמונה =====
const GalleryImageModal = ({ image, likes, currentUser, isAdmin, canGoNext, canGoPrev, onNext, onPrev, onClose, onLike, onDelete, onUpdateNote }) => {
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(image.note || '');
  const [liked, setLiked] = useState(false);

  const canEdit = currentUser === image.uploadedBy || isAdmin;
  const dateStr = new Date(image.createdAt).toLocaleDateString('he-IL', { 
    day: '2-digit', month: 'long', year: 'numeric' 
  });

  const handleSaveNote = () => {
    onUpdateNote(noteText.trim());
    setEditingNote(false);
  };

  const handleLike = () => {
    if (liked) return;
    onLike();
    setLiked(true);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-2xl max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()} dir="rtl">
        
        {/* סגירה */}
        <button onClick={onClose}
          className="absolute top-2 left-2 z-10 rounded-full bg-black/70 backdrop-blur p-2 text-white hover:bg-black/90 border border-stone-700">
          <X className="h-5 w-5" />
        </button>

        {/* חצים */}
        {canGoPrev && (
          <button onClick={onPrev}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/70 backdrop-blur p-2 text-white hover:bg-black/90 border border-stone-700">
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
        {canGoNext && (
          <button onClick={onNext}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/70 backdrop-blur p-2 text-white hover:bg-black/90 border border-stone-700">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* תמונה */}
        <div className="flex-1 flex items-center justify-center min-h-0 mb-3">
          <img src={image.dataUrl} alt={image.note || 'hand'} 
            className="max-w-full max-h-full object-contain rounded-xl border border-stone-700 shadow-2xl" />
        </div>

        {/* תחתית - פרטים */}
        <div className="rounded-2xl border border-stone-700 bg-stone-950/95 backdrop-blur p-4">
          
          {/* מעלה ותאריך */}
          <div className="flex items-center justify-between mb-3 text-sm">
            <div className="text-stone-300">
              📸 <span className="font-bold text-amber-300">{image.uploadedBy}</span>
            </div>
            <div className="text-xs text-stone-500">{dateStr}</div>
          </div>

          {/* הערה */}
          {editingNote ? (
            <div className="mb-3">
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                rows={2} maxLength={150}
                className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white text-sm focus:border-amber-600 focus:outline-none resize-none" />
              <div className="flex gap-2 mt-2">
                <button onClick={() => { setNoteText(image.note || ''); setEditingNote(false); }}
                  className="flex-1 rounded-lg border border-stone-700 bg-stone-900 px-3 py-1.5 text-xs text-stone-300">
                  ביטול
                </button>
                <button onClick={handleSaveNote}
                  className="flex-1 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-bold text-white">
                  שמור הערה
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-3">
              {image.note ? (
                <div className="text-sm text-stone-200 italic">"{image.note}"</div>
              ) : (
                <div className="text-sm text-stone-500 italic">ללא הערה</div>
              )}
              {canEdit && (
                <button onClick={() => setEditingNote(true)}
                  className="text-xs text-amber-400 hover:text-amber-300 mt-1">
                  ✏️ ערוך הערה
                </button>
              )}
            </div>
          )}

          {/* פעולות */}
          <div className="flex items-center gap-2">
            <button onClick={handleLike} disabled={liked}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-bold flex items-center justify-center gap-2 transition ${
                liked 
                  ? 'border-rose-700 bg-rose-950/40 text-rose-300 cursor-default' 
                  : 'border-stone-700 bg-stone-900 text-stone-300 hover:border-rose-700/60 hover:text-rose-300'
              }`}>
              <Heart className={`h-4 w-4 ${liked ? 'fill-rose-400 text-rose-400' : ''}`} />
              {likes} {likes === 1 ? 'לייק' : 'לייקים'}
            </button>
            {isAdmin && (
              <button onClick={onDelete}
                className="rounded-lg border border-rose-700/40 bg-rose-950/20 px-3 py-2 text-rose-300 hover:bg-rose-950/40">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


// ===== האפליקציה הראשית =====
export default function PokerApp() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentUser, setCurrentUser] = useState(null); // השם של המשתמש שנבחר
  const [allSessions, setAllSessions] = useState(ALL_INITIAL_SESSIONS);
  const [hostingSchedule, setHostingSchedule] = useState(HOSTING_SCHEDULE);
  const [players, setPlayers] = useState(INITIAL_PLAYERS);
  const [selectedSeason, setSelectedSeason] = useState(2026);
  const [modalOpen, setModalOpen] = useState(false);
  const [liveModalOpen, setLiveModalOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [adminName, setAdminName] = useState(null); // null = לא מחובר כמנהל
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [tab, setTab] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false); // תפריט המבורגר
  const [selectedChartPlayers, setSelectedChartPlayers] = useState([]);
  const [chartFullscreen, setChartFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // ציטוטים
  const [deletedQuoteIds, setDeletedQuoteIds] = useState([]);
  const [quoteLikes, setQuoteLikes] = useState({}); // {quoteId: count}
  const [userQuotes, setUserQuotes] = useState([]); // ציטוטים שנוספו על-ידי משתמשים
  
  // גלריית ידיים מנצחות
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryLikes, setGalleryLikes] = useState({});
  
  // האם יש ערב פעיל בניהול חי
  const [hasLiveSession, setHasLiveSession] = useState(false);
  
  // בודק כל כמה שניות אם יש ערב פעיל באחסון
  useEffect(() => {
    const check = () => {
      try {
        const saved = window.localStorage.getItem('poker_live_session_v1');
        if (saved) {
          const state = JSON.parse(saved);
          setHasLiveSession(!!(state.participants && state.participants.length > 0));
        } else {
          setHasLiveSession(false);
        }
      } catch { setHasLiveSession(false); }
    };
    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, [liveModalOpen]);

  // זיהוי מובייל
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // טעינת נתונים מהאחסון
  useEffect(() => {
    (async () => {
      const saved = await loadState(STORAGE_KEY);
      if (saved?.sessions) {
        setAllSessions(saved.sessions);
        if (saved.players) setPlayers(saved.players);
      }
      if (saved?.hostingSchedule) setHostingSchedule(saved.hostingSchedule);
      
      const savedQuotes = await loadState(QUOTES_STORAGE_KEY);
      if (savedQuotes?.deletedIds) setDeletedQuoteIds(savedQuotes.deletedIds);
      if (savedQuotes?.likes) setQuoteLikes(savedQuotes.likes);
      if (savedQuotes?.userQuotes) setUserQuotes(savedQuotes.userQuotes);
      
      const savedGallery = await loadState(GALLERY_STORAGE_KEY);
      if (savedGallery?.images && savedGallery.images.length > 0) {
        // יש כבר תמונות שמורות
        setGalleryImages(savedGallery.images);
        if (savedGallery.likes) setGalleryLikes(savedGallery.likes);
      } else {
        // גלריה ריקה - ננסה לטעון תמונות-זרע מהשרת
        try {
          const response = await fetch('/seed-gallery/_metadata.json');
          if (response.ok) {
            const seedMeta = await response.json();
            const seedImages = seedMeta.map(item => ({
              id: item.id,
              dataUrl: item.url,  // URL במקום base64
              note: item.note,
              uploadedBy: item.uploadedBy,
              createdAt: item.createdAt,
              isSeed: true
            }));
            setGalleryImages(seedImages);
            // שמירה כדי שלא נטען שוב
            await saveState({ images: seedImages, likes: {} }, GALLERY_STORAGE_KEY);
          }
        } catch (e) {
          // אין תמונות-זרע - גלריה ריקה (זה בסדר)
          console.log('No seed gallery available');
        }
      }
      
      // טעינת המשתמש שנבחר בעבר
      try {
        const savedUser = window.localStorage.getItem('poker_user_name');
        if (savedUser) {
          setCurrentUser(savedUser);
          setShowSplash(false); // אם כבר נכנסת בעבר, מדלגים על הספלאש
        }
        const savedAdmin = window.localStorage.getItem('poker_admin_name');
        if (savedAdmin) setAdminName(savedAdmin);
      } catch {}
      
      setLoading(false);
    })();
  }, []);

  const sessions = useMemo(() => allSessions.filter(s => (s.season || 2026) === selectedSeason), [allSessions, selectedSeason]);
  const stats = useMemo(() => calculateStats(sessions, players), [sessions, players]);
  
  // רשימת שחקנים ממוינת לפי מספר מפגשים בכל ההיסטוריה (מהפעיל ביותר לפחות פעיל)
  const sortedPlayers = useMemo(() => {
    const counts = {};
    players.forEach(p => { counts[p] = 0; });
    // סופרים מפגשים מכל העונות, לא רק העונה הנוכחית
    allSessions.forEach(s => {
      Object.keys(s.results || {}).forEach(name => {
        if (counts[name] !== undefined) counts[name]++;
      });
    });
    // מיון: הכי הרבה מפגשים למעלה; שווה - לפי סדר אלפביתי
    return [...players].sort((a, b) => {
      if (counts[b] !== counts[a]) return counts[b] - counts[a];
      return a.localeCompare(b, 'he');
    });
  }, [players, allSessions]);
  
  const availableSeasons = useMemo(() => {
    const s = new Set(allSessions.map(s => s.season || 2026));
    return Array.from(s).sort((a, b) => b - a);
  }, [allSessions]);

  useEffect(() => {
    if (stats.length > 0 && selectedChartPlayers.length === 0) {
      setSelectedChartPlayers(stats.slice(0, 5).map(p => p.name));
    }
  }, [stats.length]);

  const persistSessions = async (sessions, players, hostingScheduleParam) => {
    setSyncing(true);
    await saveState({ sessions, players, hostingSchedule: hostingScheduleParam || hostingSchedule }, STORAGE_KEY);
    setSyncing(false);
  };

  const handleHostingUpdate = async (newSchedule) => {
    setHostingSchedule(newSchedule);
    await persistSessions(allSessions, players, newSchedule);
  };

  const handleUserSelect = (name) => {
    setCurrentUser(name);
    try { window.localStorage.setItem('poker_user_name', name); } catch {}
  };

  const handleSwitchUser = () => {
    if (!confirm('להחליף משתמש?')) return;
    setCurrentUser(null);
    setAdminName(null);
    try {
      window.localStorage.removeItem('poker_user_name');
      window.localStorage.removeItem('poker_admin_name');
    } catch {}
  };

  const isAdminEligible = currentUser && ADMIN_NAMES.includes(currentUser);

  const persistQuotes = async (deletedIds, likes, userQuotesList) => {
    await saveState({ 
      deletedIds, 
      likes,
      userQuotes: userQuotesList !== undefined ? userQuotesList : userQuotes
    }, QUOTES_STORAGE_KEY);
  };

  const handleAddQuote = async (newQuote) => {
    const updated = [...userQuotes, newQuote];
    setUserQuotes(updated);
    await persistQuotes(deletedQuoteIds, quoteLikes, updated);
  };

  // ===== פונקציות גלריה =====
  const persistGallery = async (images, likes) => {
    await saveState({ images, likes }, GALLERY_STORAGE_KEY);
  };

  const handleAddImage = async (newImage) => {
    const updated = [newImage, ...galleryImages]; // חדשים ראשונים
    setGalleryImages(updated);
    await persistGallery(updated, galleryLikes);
  };

  const handleDeleteImage = async (id) => {
    if (!confirm('למחוק את התמונה?')) return;
    const updated = galleryImages.filter(img => img.id !== id);
    setGalleryImages(updated);
    const newLikes = { ...galleryLikes };
    delete newLikes[id];
    setGalleryLikes(newLikes);
    await persistGallery(updated, newLikes);
  };

  const handleLikeImage = async (id) => {
    const newLikes = { ...galleryLikes, [id]: (galleryLikes[id] || 0) + 1 };
    setGalleryLikes(newLikes);
    await persistGallery(galleryImages, newLikes);
  };

  const handleUpdateImageNote = async (id, note) => {
    const updated = galleryImages.map(img => img.id === id ? { ...img, note } : img);
    setGalleryImages(updated);
    await persistGallery(updated, galleryLikes);
  };

  const handleSaveSession = async (newSession) => {
    const updated = [...allSessions.filter(s => !(s.date === newSession.date && (s.season || 2026) === (newSession.season || 2026))), newSession];
    setAllSessions(updated);
    const newNames = Object.keys(newSession.results).filter(n => !players.includes(n));
    const updatedPlayers = newNames.length > 0 ? [...players, ...newNames] : players;
    if (newNames.length > 0) setPlayers(updatedPlayers);
    await persistSessions(updated, updatedPlayers);
  };

  const handleDeleteSession = async (date) => {
    const updated = allSessions.filter(s => !(s.date === date && (s.season || 2026) === selectedSeason));
    setAllSessions(updated);
    await persistSessions(updated, players);
  };

  const handleReset = async () => {
    if (!confirm('לאפס את כל הנתונים לברירת המחדל? זה ימחק את כל השינויים!')) return;
    setAllSessions(ALL_INITIAL_SESSIONS); setPlayers(INITIAL_PLAYERS);
    await persistSessions(ALL_INITIAL_SESSIONS, INITIAL_PLAYERS);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ sessions: allSessions, players }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `poker-data-${new Date().toISOString().split('T')[0]}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.sessions) {
        setAllSessions(data.sessions);
        if (data.players) setPlayers(data.players);
        await persistSessions(data.sessions, data.players || players);
      }
    } catch (err) { alert('קובץ לא תקין'); }
  };

  const handleAdminLogin = async (name) => {
    setAdminName(name);
    // שמירה של שם המנהל באחסון המקומי של הדפדפן (לא במרכזי) כדי שיישאר מחובר
    try { window.localStorage.setItem('poker_admin_name', name); } catch {}
  };

  const handleLogout = () => {
    setAdminName(null);
    try { window.localStorage.removeItem('poker_admin_name'); } catch {}
  };

  // בדיקה אם יש שם מנהל שמור מקומית (נשמר בדפדפן)
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('poker_admin_name');
      if (saved) setAdminName(saved);
    } catch {}
  }, []);

  const handleQuoteLike = async (id) => {
    const newLikes = { ...quoteLikes, [id]: (quoteLikes[id] || 0) + 1 };
    setQuoteLikes(newLikes);
    await persistQuotes(deletedQuoteIds, newLikes);
  };

  const handleQuoteDelete = async (id) => {
    const newDeleted = [...deletedQuoteIds, id];
    setDeletedQuoteIds(newDeleted);
    await persistQuotes(newDeleted, quoteLikes);
  };

  const isAdmin = !!adminName;
  const latestDate = getLatestSessionDate(sessions);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center" style={{ fontFamily: 'Assistant, sans-serif' }}>
        <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
      </div>
    );
  }

  // מסך פתיחה
  if (showSplash) {
    return <SplashScreen onEnter={() => setShowSplash(false)} />;
  }

  // מסך בחירת משתמש (אם עוד לא בחר)
  if (!currentUser) {
    return <UserSelectScreen players={sortedPlayers} onSelect={handleUserSelect} />;
  }

  // מסך מלא לגרף
  if (chartFullscreen) {
    return (
      <div dir="rtl" className="fixed inset-0 z-50 bg-stone-950 p-4 overflow-auto" style={{ fontFamily: 'Assistant, sans-serif' }}>
        <CumulativeChart sessions={sessions} stats={stats} fullscreen={true}
          onFullscreenToggle={() => setChartFullscreen(false)}
          selectedPlayers={selectedChartPlayers}
          onPlayersChange={setSelectedChartPlayers}
          isMobile={isMobile} />
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'דשבורד', icon: LayoutDashboard },
    { id: 'table', label: 'טבלה', icon: Table },
    { id: 'periodic', label: 'תקופות', icon: Calendar },
    { id: 'charts', label: 'גרפים', icon: BarChart3 },
    { id: 'hosting', label: 'אירוחים', icon: Calendar },
    { id: 'gallery', label: 'גלריה', icon: ImageIcon },
    { id: 'history', label: 'היסטוריה', icon: History },
    { id: 'quotes', label: 'ציטוטים', icon: Quote },
  ];

  return (
    <div dir="rtl" className="min-h-screen relative overflow-x-hidden" 
      style={{ 
        fontFamily: 'Assistant, sans-serif',
        background: 'radial-gradient(ellipse at center, #0f5132 0%, #0a3520 50%, #041810 100%)'
      }}>
      {/* רקע דקורטיבי */}
      <div className="fixed inset-0 opacity-[0.04] pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, #fbbf24 1px, transparent 1px), radial-gradient(circle at 75% 75%, #fbbf24 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />
      <div className="fixed top-0 right-0 w-96 h-96 bg-amber-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-red-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {/* לוגו BarburAI */}
              <img src={BARBUR_LOGO}
                alt="BarburAI"
                className="h-14 w-14 md:h-16 md:w-16 object-contain drop-shadow-lg"
                onError={(e) => { e.target.style.display = 'none'; }} />
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent tracking-tight">
                  פוקר ברבורי תל מונד
                </h1>
                {latestDate && (
                  <div className="text-xs text-stone-500 mt-0.5">
                    מעודכן: <span className="text-amber-300 font-bold">{new Date(latestDate).toLocaleDateString('he-IL', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* כפתור המבורגר - פותח תפריט */}
              <button onClick={() => setMenuOpen(true)}
                className="rounded-lg bg-stone-900/70 border border-stone-700 p-2 text-stone-300 hover:bg-stone-800 hover:text-amber-300 transition"
                title="תפריט">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* תגית המשתמש הנוכחי */}
              <button onClick={handleSwitchUser}
                className="flex items-center gap-2 rounded-lg bg-stone-900/70 border border-stone-700 px-3 py-1.5 text-sm text-stone-200 hover:bg-stone-800 transition">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>שלום, <span className="font-bold text-amber-300">{currentUser}</span></span>
              </button>

              <select value={selectedSeason} onChange={e => setSelectedSeason(Number(e.target.value))}
                className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-white font-bold">
                {availableSeasons.map(y => <option key={y} value={y}>עונת {y}</option>)}
              </select>

              {syncing && <span className="text-xs text-amber-400 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />שומר...</span>}

              {isAdmin ? (
                <>
                  {/* תגית מנהל */}
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-950/30 border border-emerald-800/50 px-3 py-1.5">
                    <Lock className="h-3 w-3 text-emerald-400" />
                    <span className="text-xs text-emerald-300 font-bold">מנהל</span>
                  </div>
                </>
              ) : isAdminEligible ? (
                <button onClick={() => setLoginOpen(true)}
                  className="rounded-lg border border-amber-700/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-300 hover:bg-amber-950/50 flex items-center gap-2">
                  <Lock className="h-4 w-4" /> כניסת מנהל
                </button>
              ) : null}
            </div>
          </div>

          {/* ניווט ראשי */}
          <div className="mt-5">
            <nav className="relative rounded-2xl border-2 border-amber-900/40 p-1.5 flex gap-1 overflow-x-auto shadow-2xl"
              style={{
                background: 'linear-gradient(180deg, rgba(12, 10, 8, 0.85) 0%, rgba(20, 15, 10, 0.9) 100%)',
                boxShadow: 'inset 0 1px 3px rgba(251, 191, 36, 0.1), 0 10px 40px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              }}>
              {tabs.map(t => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`flex-1 min-w-fit px-3 md:px-5 py-2.5 text-xs md:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap ${
                      active ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-900/50' : 'text-stone-400 hover:text-amber-200 hover:bg-stone-900/50'
                    }`}>
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        {/* Content */}
        {tab === 'dashboard' && (
          <DashboardCarousel 
            currentUser={currentUser} 
            sessions={sessions} 
            stats={stats} 
            hostingSchedule={hostingSchedule}
            onGoToHosting={() => setTab('hosting')}
            onFullscreenToggle={() => setChartFullscreen(true)}
            selectedChartPlayers={selectedChartPlayers}
            setSelectedChartPlayers={setSelectedChartPlayers}
            isMobile={isMobile}
          />
        )}

        {tab === 'table' && <MainLeaderboard stats={stats} sessions={sessions} />}

        {tab === 'periodic' && <PeriodicTables allSessions={allSessions} players={players} />}

        {tab === 'charts' && (
          <CumulativeChart sessions={sessions} stats={stats} fullscreen={false}
            onFullscreenToggle={() => setChartFullscreen(true)}
            selectedPlayers={selectedChartPlayers}
            onPlayersChange={setSelectedChartPlayers}
            isMobile={isMobile} />
        )}

        {tab === 'hosting' && (
          <HostingWrapper allSessions={allSessions} hostingSchedule={hostingSchedule}
            players={players} sortedPlayers={sortedPlayers} isAdmin={isAdmin}
            onUpdate={handleHostingUpdate} adminName={adminName} />
        )}

        {tab === 'history' && <SessionHistory sessions={sessions} onDelete={handleDeleteSession} isAdmin={isAdmin} />}

        {tab === 'gallery' && (
          <GalleryTab 
            images={galleryImages}
            likes={galleryLikes}
            currentUser={currentUser}
            isAdmin={isAdmin}
            onAdd={handleAddImage}
            onDelete={handleDeleteImage}
            onLike={handleLikeImage}
            onUpdateNote={handleUpdateImageNote} />
        )}

        {tab === 'quotes' && (
          <QuotesSection 
            deletedIds={deletedQuoteIds} 
            likes={quoteLikes}
            userQuotes={userQuotes}
            currentUser={currentUser}
            players={sortedPlayers}
            onDelete={handleQuoteDelete} 
            onLike={handleQuoteLike} 
            onAddQuote={handleAddQuote}
            isAdmin={isAdmin} />
        )}

        <footer className="mt-10 pb-6 text-center text-xs text-stone-600 tracking-[0.15em] uppercase">
          {sessions.length} מפגשים • {stats.length} שחקנים • עונת {selectedSeason} • 
          <span className="text-amber-600/60"> BARBUR AI</span>
        </footer>
      </div>

      {/* תפריט צד - המבורגר */}
      {menuOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="absolute top-0 right-0 bottom-0 w-[85vw] max-w-sm bg-stone-950 border-l border-stone-800 shadow-2xl overflow-y-auto"
            onClick={e => e.stopPropagation()} dir="rtl">
            {/* כותרת תפריט */}
            <div className="sticky top-0 bg-stone-950/95 backdrop-blur border-b border-stone-800 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-3xl">♠</div>
                <div>
                  <div className="text-xs text-amber-500/80 tracking-[0.15em] font-bold">BARBUR AI</div>
                  <div className="text-base font-extrabold text-amber-200">תפריט</div>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)}
                className="rounded-lg p-2 text-stone-400 hover:bg-stone-800 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* המשתמש הנוכחי */}
            <div className="px-5 py-4 border-b border-stone-800">
              <div className="text-xs text-stone-500 mb-1">מחובר כ:</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-bold text-amber-300 text-lg">{currentUser}</span>
                  {isAdmin && (
                    <span className="rounded-md bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 text-xs text-emerald-300 font-bold">
                      מנהל
                    </span>
                  )}
                </div>
                <button onClick={() => { setMenuOpen(false); handleSwitchUser(); }}
                  className="text-xs text-stone-400 hover:text-amber-300 underline">
                  החלף
                </button>
              </div>
            </div>

            {/* פעולות מנהל */}
            {isAdmin && (
              <div className="px-5 py-4 border-b border-stone-800 space-y-2">
                <div className="text-xs text-stone-500 tracking-wider font-bold uppercase">עדכון ערב</div>
                <button onClick={() => { setMenuOpen(false); setLiveModalOpen(true); }}
                  className="relative w-full flex items-center gap-3 rounded-lg bg-gradient-to-br from-emerald-700/80 to-emerald-800/80 border border-emerald-700/50 px-4 py-3 text-white font-bold hover:from-emerald-600 hover:to-emerald-700 transition text-sm">
                  <span className="text-xl">🎰</span>
                  <span>עדכון ערב בלייב</span>
                  {hasLiveSession && (
                    <span className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </button>
                <button onClick={() => { setMenuOpen(false); setModalOpen(true); }}
                  className="w-full flex items-center gap-3 rounded-lg bg-gradient-to-br from-blue-700/80 to-blue-800/80 border border-blue-700/50 px-4 py-3 text-white font-bold hover:from-blue-600 hover:to-blue-700 transition text-sm">
                  <span className="text-xl">📸</span>
                  <span>עדכון ערב בתמונה</span>
                </button>
              </div>
            )}

            {/* כפתור כניסת מנהל (לאלו שעוד לא מנהלים אבל יכולים להיות) */}
            {!isAdmin && isAdminEligible && (
              <div className="px-5 py-4 border-b border-stone-800">
                <button onClick={() => { setMenuOpen(false); setLoginOpen(true); }}
                  className="w-full flex items-center gap-3 rounded-lg border border-amber-700/50 bg-amber-950/30 px-4 py-3 text-amber-300 hover:bg-amber-950/50 transition text-sm font-bold">
                  <Lock className="h-4 w-4" />
                  <span>כניסת מנהל</span>
                </button>
              </div>
            )}

            {/* טאבים */}
            <div className="px-5 py-4 space-y-1">
              <div className="text-xs text-stone-500 tracking-wider font-bold uppercase mb-2">ניווט</div>
              {tabs.map(t => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button key={t.id} onClick={() => { setTab(t.id); setMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-right font-bold transition ${
                      active 
                        ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-900/30' 
                        : 'text-stone-300 hover:bg-stone-900 hover:text-amber-200'
                    }`}>
                    <Icon className="h-5 w-5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* עונה */}
            <div className="px-5 py-4 border-t border-stone-800">
              <div className="text-xs text-stone-500 tracking-wider font-bold uppercase mb-2">עונה</div>
              <select value={selectedSeason} onChange={e => setSelectedSeason(Number(e.target.value))}
                className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2.5 text-white font-bold">
                {availableSeasons.map(y => <option key={y} value={y}>עונת {y}</option>)}
              </select>
            </div>

            <div className="px-5 py-6 text-center text-xs text-stone-600 tracking-widest">
              BARBUR AI · 2026
            </div>
          </div>
        </div>
      )}

      <AddSessionModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        onSave={handleSaveSession} players={sortedPlayers} currentSeason={selectedSeason} adminName={currentUser} />
      
      <LiveSessionModal isOpen={liveModalOpen} onClose={() => setLiveModalOpen(false)}
        onSave={handleSaveSession} players={sortedPlayers} currentSeason={selectedSeason} adminName={currentUser} />
      
      <AdminLoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} onLogin={handleAdminLogin} currentUser={currentUser} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&family=Assistant:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Heebo', 'Assistant', sans-serif !important; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; transform: translateY(-50%) translateX(0); }
          50% { opacity: 0.85; transform: translateY(-50%) translateX(-3px); }
        }
        .animate-pulse-subtle { animation: pulse-subtle 1.8s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
